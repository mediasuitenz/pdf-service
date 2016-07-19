'use strict'

const fs = require('fs')
const tmp = require('tmp')
const execa = require('execa')
const debug = require('debug')('pdf-service')

const catchCmdlineError = (err, res) => {
  const stderr = err.stderr
  const newlineIndex = stderr.indexOf('\n')
  debug(stderr.substr(0, newlineIndex))
  res.status(500).send(err)
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
    }).catch(err => catchCmdlineError(err, res))
  },

  createFileList (req, res, next) {
    debug('create file list')
    req.filelist = [`${req.temp.name}/html.pdf`]

    if (req.body.attachments) {
      // create a temp file for each pdf to attach
      req.body.attachments.forEach((base64, i) => {
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
      command = 'gs'
      args = [
        '-dBATCH',
        '-dNOPAUSE',
        '-q',
        '-sDEVICE=pdfwrite',
        `-sOutputFile=${req.temp.name}/pre-stamp.pdf`
      ].concat(req.filelist)
    }

    execa(command, args)
      .then(() => next())
      .catch(err => catchCmdlineError(err, res))
  },

  createPostscript (req, res, next) {
    if (!req.body.stamp) next()

    debug('adding text to template')
    // check stamp for backwards compatibility
    if (typeof req.body.stamp === 'string') {
      req.body.stamp = {
        lineOne: '',
        lineTwo: req.body.stamp
      }
    }
    const args = [
      '-e',
      `s/<STAMP_LINE_ONE>/${req.body.stamp.lineOne}/`,
      '-e',
      `s/<STAMP_LINE_TWO>/${req.body.stamp.lineTwo}/`,
      'stamp.template.ps'
    ]
    execa('sed', args).then(result => {
      debug('write postscript file')
      fs.writeFile(`${req.temp.name}/stamp.ps`, result.stdout, err => {
        if (err) {
          debug('error writing postscript file')
          res.status(500).send(err)
        }

        next()
      })
    }).catch(err => catchCmdlineError(err, res))
  },

  addStamp (req, res, next) {
    debug('add stamp')

    if (!req.body.stamp) {
      execa('mv', [`${req.temp.name}/pre-stamp.pdf`, `${req.temp.name}/output.pdf`])
        .then(() => next())
        .catch(err => catchCmdlineError(err, res))
    } else {
      debug('stamp each page')
      const args = [
        '-dBATCH',
        '-dNOPAUSE',
        '-q',
        '-sDEVICE=pdfwrite',
        `-sOutputFile=${req.temp.name}/output.pdf`,
        `${req.temp.name}/stamp.ps`,
        `${req.temp.name}/pre-stamp.pdf`
      ]
      execa('gs', args)
        .then(() => next())
        .catch(err => catchCmdlineError(err, res))
    }
  }
}
