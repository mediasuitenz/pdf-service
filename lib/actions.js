"use strict";

const fs = require("fs");

module.exports = {
  ping(req, res) {
    res.send("PONG");
  },
  sendFile(req, res) {
    req.app.U.logger.debug("in sendFile");
    const readStream = fs.createReadStream(`${req.temp.name}/output.pdf`);
    let responseSent = false;
    setTimeout(() => {
      if (!responseSent) {
        req.app.U.logger.error("PDF not sent");
        req.temp.removeCallback();
      }
    }, 30 * 1000); // TODO: should this be a param?
    readStream.on("open", () => readStream.pipe(res));
    readStream.on("end", () => {
      req.temp.removeCallback();
    });
    readStream.on("close", () => {
      req.app.U.logger.debug("in close");
    });
    readStream.on("error", (err) => {
      req.app.U.logger.error("There was an issue sending the pdf", err);
      res.set("Content-Type", "application/json");
      res.status(500).send(`{"message": "${err.message}"}`);
    });
    res.on("finish", () => {
      responseSent = true;
      req.app.U.logger.debug("Finished sending to the response");
    });
  },
};
