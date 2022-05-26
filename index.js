"use strict";

const mw = require("./lib/middleware");
const actions = require("./lib/actions");
const app = require("express")();
const bodyParser = require("body-parser");
const argv = require("minimist")(process.argv.slice(2));
const bodyLimit = argv.limit || "50mb";
const port = argv.port || 3000;

app.get("/ping", actions.ping);

app.use("/", [
  mw.setHeaders,
  bodyParser.json({ limit: bodyLimit }),
  mw.setupTemp,
  mw.writeHtmlFile,
  mw.convertHtmlToPdf,
  mw.createFileList,
  mw.mergeFileList,
  mw.createPdfStamp,
  mw.addStamp,
  mw.errorHandler,
]);

app.post("/", actions.sendFile);

app.listen(port, () => console.log("server listening on port %d", port));
