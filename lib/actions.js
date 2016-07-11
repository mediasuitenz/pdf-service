'use strict'

const fs = require('fs')
const debug = require('debug')('pdf-service')

module.exports = {
  sendFile (req, res) {
    debug('send file')
    fs.createReadStream(`${req.temp.name}/output.pdf`)
      .pipe(res)
      .on('end', () => req.temp.removeCallbackfunction())
  }
}
