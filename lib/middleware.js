'use strict'

const fs = require('fs')
const tmp = require('tmp')
const execa = require('execa')
const debug = require('debug')('pdf-service')

const catchCmdlineError = (err, next) => {
  const stderr = err.stderr
  const newlineIndex = stderr.indexOf('\n')
  debug(stderr.substr(0, newlineIndex))
  next(err)
}

module.exports = {
  setHeaders (req, res, next) {
    debug('setting headers')
    res.set('Access-Control-Allow-Origin', '*')
    res.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    res.set('Content-Type', 'application/pdf')
    next()
  },

  setupTemp (req, res, next) {
    debug('setup temp storage')
    req.temp = tmp.dirSync({unsafeCleanup: true})
    next()
  },

  writeHtmlFile (req, res, next) {
    debug('write html file')
    if (!req.body.html) next({error: 'Request must contain HTML for conversion'})
    fs.writeFile(`${req.temp.name}/html.html`, req.body.html, err => {
      if (err) res.status(500).send(err)

      next()
    })
  },

  convertHtmlToPdf (req, res, next) {
    debug('convert html to pdf')
    const args = [
      '--margin-bottom',
      '23',
      `${req.temp.name}/html.html`,
      `${req.temp.name}/html.pdf`
    ]

    execa('wkhtmltopdf', args).then(() => {
      debug('main pdf creation complete')
      next()
    }).catch(err => catchCmdlineError(err, next))
  },

  createFileList (req, res, next) {
    debug('create file list')
    req.filelist = [`${req.temp.name}/html.pdf`]

    if (req.body.attachments) {
      // create a temp file for each pdf to attach
      req.body.attachments.forEach((base64, i) => {
        if (base64.length === 0) return
        const filename = `${req.temp.name}/html.pdf${i}`
        req.filelist.push(filename)
        fs.writeFileSync(filename, new Buffer(base64, 'base64'))
      })
    }
    next()
  },

  mergeFileList (req, res, next) {
    debug('merge file list')
    let command, args

    if (req.filelist.length === 1) {
      debug('no attachments')
      command = 'mv'
      args = [
        `${req.temp.name}/html.pdf`,
        `${req.temp.name}/pre-stamp.pdf`
      ]
    } else {
      debug('merge files')
      command = 'pdftk'
      args = req.filelist.concat([
        'cat',
        'output',
        `${req.temp.name}/pre-stamp.pdf`
      ])
    }

    execa(command, args)
      .then(() => next())
      .catch(err => catchCmdlineError(err, next))
  },

  createPdfStamp (req, res, next) {
    if (!req.body.stamp) next()

    // write stamp html to file for conversion
    fs.writeFile(`${req.temp.name}/stamp.html`, req.body.stamp, err => {
      if (err) next(err)

      debug('convert stamp.html to stamp.pdf')
      const args = [
        `${req.temp.name}/stamp.html`,
        `${req.temp.name}/stamp.pdf`
      ]

      execa('wkhtmltopdf', args).then(() => {
        debug('creation of pdf stamp complete')
        next()
      }).catch(err => catchCmdlineError(err, next))
    })
  },

  addStamp (req, res, next) {
    debug('add stamp')

    if (!req.body.stamp) {
      execa('mv', [`${req.temp.name}/pre-stamp.pdf`, `${req.temp.name}/output.pdf`])
        .then(() => next())
        .catch(err => catchCmdlineError(err, next))
    } else {
      debug('stamp each page')
      const args = [
        `${req.temp.name}/pre-stamp.pdf`,
        'stamp',
        `${req.temp.name}/stamp.pdf`,
        'output',
        `${req.temp.name}/output.pdf`
      ]
      execa('pdftk', args)
        .then(() => next())
        .catch(err => catchCmdlineError(err, res))
    }
  },

  errorHandler (err, req, res, next) {
    if (req.method === 'POST') {
      res.status(500).send(err)
      next(err)
    }
    next()
  }
}
