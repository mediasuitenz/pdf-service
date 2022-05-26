"use strict";

const fs = require("fs");
const debug = require("debug")("pdf-service");

module.exports = {
  ping(req, res) {
    res.send("PONG");
  },
  sendFile(req, res) {
    debug("send file");
    const readStream = fs.createReadStream(`${req.temp.name}/output.pdf`);
    readStream.on("open", () => readStream.pipe(res));
    readStream.on("end", () => req.temp.removeCallback());
    readStream.on("error", (err) => res.status(500).send(err));
  },
};
