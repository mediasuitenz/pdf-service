"use strict";

const mw = require("./lib/middleware");
const actions = require("./lib/actions");
const app = require("express")();
const bodyParser = require("body-parser");
const morgan = require("morgan");
const winston = require("winston");
const argv = require("minimist")(process.argv.slice(2));
const bodyLimit = argv.limit || "50mb";
const port = argv.port || 3002;
const logLevel = argv.loglevel || "debug";

process.on("SIGINT", () => {
  console.info("Interrupted");
  process.exit(0);
});

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      level: logLevel,
      json: true,
    }),
  ],
});

app.U = app.U || {};
app.U.logger = logger;

const morganJSONFormat = () =>
  JSON.stringify({
    method: ":method",
    url: ":url",
    http_version: ":http-version",
    remote_addr: ":remote-addr",
    remote_addr_forwarded: ":req[x-forwarded-for]", //Get a specific header
    response_time: ":response-time",
    status: ":status",
    content_length: ":res[content-length]",
    timestamp: ":date[iso]",
    user_agent: ":user-agent",
  });

app.use(
  morgan(morganJSONFormat(), {
    stream: {
      write: (message) => {
        const data = JSON.parse(message);
        return logger.info("accesslog", data);
      },
    },
  })
);

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
