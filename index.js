'use strict'

const fs = require('fs')
const tmp = require('tmp')
const app = require('express')()
const execute = require('child_process').exec
const bodyParser = require('body-parser')
const port = 3000
const exec = command => {
  return new Promise((resolve, reject) => {
    execute(command, (err, stdout, stderr) => {
      if (err) reject(err)

      resolve(stdout, stderr)
    })
  })
}

app.use(bodyParser.json())

app.post('/', (req, res) => {
  const temp = tmp.dirSync({unsafeCleanup: true})
  const attachments = req.body.attachments

  // save html in temporary file
  fs.writeFile(`${temp.name}/html`, req.body.html, err => {
    if (err) res.send(err)

    // convert html to pdf
    exec(`wkhtmltopdf ${temp.name}/html ${temp.name}/pdf`)
      .then(() => {
        const filelist = [`${temp.name}/pdf`]

        if (attachments) {
          // create a temp file for each pdf to attach
          attachments.forEach((base64, i) => {
            const filename = `${temp.name}/pdf${i}`
            filelist.push(filename)
            fs.writeFileSync(filename, new Buffer(base64, 'base64'))
          })
        }
        return filelist
      })
      .then(filelist => {
        if (filelist.length === 1) {
          return exec(`mv ${temp.name}/pdf ${temp.name}/output`)
        } else {
          // merge pdfs with ghostscript
          let cmd = `gs -dBATCH -dNOPAUSE -q -sDEVICE=pdfwrite -sOutputFile=${temp.name}/output ${filelist.join(' ')}`
          return exec(cmd)
        }
      })
      .then(() => {
        res.set('Content-Type', 'application/pdf')
        fs.createReadStream(`${temp.name}/output`).pipe(res)
      })
      .then(() => temp.removeCallback())
      .catch(err => res.send(err))
  })
})

app.listen(port, () => console.log('server listening on port %d', port))
