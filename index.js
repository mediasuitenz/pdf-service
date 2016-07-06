'use strict'

const fs = require('fs')
const tmp = require('tmp')
const app = require('express')()
const execute = require('child_process').exec
const bodyParser = require('body-parser')
const bodyLimit = '50mb'
const port = process.argv[2] || 3000
const exec = command => {
  return new Promise((resolve, reject) => {
    execute(command, (err, stdout, stderr) => {
      if (err) reject(err)

      resolve(stdout, stderr)
    })
  })
}

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

app.use(bodyParser.json({limit: bodyLimit}))

app.post('/', (req, res) => {
  const temp = tmp.dirSync({unsafeCleanup: true})
  const attachments = req.body.attachments
  const stamp = req.body.stamp

  // save html in temporary file
  fs.writeFile(`${temp.name}/html.html`, req.body.html, err => {
    if (err) res.send(err)

    const htmlToPdf = [
      'wkhtmltopdf',
      '--margin-bottom "30mm"',
      `${temp.name}/html.html`,
      `${temp.name}/html.pdf`
    ].join(' ')

    // convert html to pdf
    exec(htmlToPdf)
      .then(() => {
        const filelist = [`${temp.name}/html.pdf`]

        if (attachments) {
          // create a temp file for each pdf to attach
          attachments.forEach((base64, i) => {
            const filename = `${temp.name}/html.pdf${i}`
            filelist.push(filename)
            fs.writeFileSync(filename, new Buffer(base64, 'base64'))
          })
        }
        return filelist
      })
      .then(filelist => {
        if (filelist.length === 1) {
          // rename single pdf
          return exec(`mv ${temp.name}/html.pdf ${temp.name}/pre-stamp.pdf`)
        } else {
          // merge pdfs with ghostscript
          let cmd = [
            'gs -dBATCH',
            '-dNOPAUSE -q',
            '-sDEVICE=pdfwrite',
            `-sOutputFile=${temp.name}/pre-stamp.pdf`
          ].concat(filelist).join(' ')
          return exec(cmd)
        }
      })
      .then(() => {
        if (!stamp) {
          return exec(`mv ${temp.name}/pre-stamp.pdf ${temp.name}/output.pdf`)
        } else {
          // add text to template
          const addText = [
            'sed',
            `-e "s/<STAMP_LINE_ONE>/${stamp.lineOne}/"`,
            `-e "s/<STAMP_LINE_TWO>/${stamp.lineTwo}/"`,
            `< stamp.template.ps >`,
            `${temp.name}/stamp.ps`
          ].join(' ')
          // add stamp to each page
          const addStamp = [
            'gs -dBATCH',
            '-dNOPAUSE -q',
            '-sDEVICE=pdfwrite',
            `-sOutputFile=${temp.name}/output.pdf`,
            `${temp.name}/stamp.ps`,
            `${temp.name}/pre-stamp.pdf`
          ].join(' ')
          return exec(addText).then(() => exec(addStamp))
        }
      })
      .then(() => {
        res.set('Content-Type', 'application/pdf')
        fs.createReadStream(`${temp.name}/output.pdf`)
            .pipe(res)
            .on('end', () => temp.removeCallback())
      })
      .catch(err => res.send(err))
  })
})

app.listen(port, () => console.log('server listening on port %d', port))
