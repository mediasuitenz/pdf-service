"use strict";

const fs = require("fs");
const tmp = require("tmp");
const execa = require("execa");
const axios = require("axios");

const catchCmdlineError = (err, next, req) => {
  req.app.U.logger.error("Unable to process PDF or attachements", err);
  next(new Error("Unable to process PDF or attachements"));
};

module.exports = {
  setHeaders(req, res, next) {
    req.app.U.logger.debug("setting headers");
    res.set("Access-Control-Allow-Origin", "*");
    res.set(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    res.set("Content-Type", "application/pdf");
    next();
  },

  setupTemp(req, res, next) {
    req.app.U.logger.debug("setup temp storage");
    req.temp = tmp.dirSync({ unsafeCleanup: true });
    next();
  },

  writeHtmlFile(req, res, next) {
    if (!req.body.html) {
      // HTML is optional
      next();
    }
    req.app.U.logger.debug("write html file");
    fs.writeFile(`${req.temp.name}/html.html`, req.body.html, (err) => {
      if (err) return next(err);
      next();
    });
  },

  convertHtmlToPdf(req, res, next) {
    if (!req.body.html) {
      // HTML is optional
      next();
    }

    req.app.U.logger.debug("convert html to pdf");
    const args = [
      "--margin-bottom",
      "23",
      `${req.temp.name}/html.html`,
      `${req.temp.name}/html.pdf`,
    ];

    execa("wkhtmltopdf", args)
      .then(() => {
        req.app.U.logger.debug("main pdf creation complete");
        next();
      })
      .catch((err) => catchCmdlineError(err, next, req));
  },

  async createFileList(req, res, next) {
    req.app.U.logger.debug("create file list. attachments=", req.body.attachments);
    req.filelist = [];
    
    if (req.body.html) {
      req.filelist.push(`${req.temp.name}/html.pdf`);
    }

    const attachments = req.body.attachments;
    if (!attachments || attachments.length === 0) return next();

    // create a temp file for each pdf to attach
    await Promise.all(
      attachments.map(async (attachment, i) => {
        if (typeof attachment !== "string") {
          req.app.U.logger.error(
            `Attachment content expected a string got "${typeof attachment}" in payload (${attachment})`
          );
          return;
        }
        if (attachment.length === 0) return;

        const filename = `${req.temp.name}/html.${i}.pdf`;
        const regex = RegExp(/^https?:\/\//);
        let content;

        if (regex.test(attachment)) {
          try {
            const response = await axios.get(attachment, {
              responseType: "arraybuffer",
            });
            content = response.data;
          } catch (e) {
            req.app.U.logger.error(
              `failed to download attachment ${attachment}`,
              e
            );
            return;
          }
        } else {
          content = Buffer.from(attachment, "base64");
        }

        fs.writeFileSync(filename, content);
        req.filelist.push(filename);
      })
    ).catch(next);

    req.app.U.logger.debug("file list: ", req.filelist)
    next();
  },

  mergeFileList(req, res, next) {
    req.app.U.logger.debug("merge file list");
    let command, args;

    if (req.filelist.length === 1) {
      req.app.U.logger.debug("just one file");
      command = "mv";
      args = [req.filelist[0], `${req.temp.name}/pre-stamp.pdf`];
    } else {
      req.app.U.logger.debug("merge files");
      command = "pdftk";
      args = req.filelist.concat([
        "cat",
        "output",
        `${req.temp.name}/pre-stamp.pdf`,
      ]);
    }

    execa(command, args)
      .then(() => next())
      .catch((err) => catchCmdlineError(err, next, req));
  },

  createPdfStamp(req, res, next) {
    if (!req.body.stamp) return next();

    // write stamp html to file for conversion
    fs.writeFile(`${req.temp.name}/stamp.html`, req.body.stamp, (err) => {
      if (err) return next(err);

      req.app.U.logger.debug("convert stamp.html to stamp.pdf");
      const args = [
        `${req.temp.name}/stamp.html`,
        `${req.temp.name}/stamp.pdf`,
      ];

      execa("wkhtmltopdf", args)
        .then(() => {
          req.app.U.logger.debug("creation of pdf stamp complete");
          next();
        })
        .catch((err) => catchCmdlineError(err, next, req));
    });
  },

  addStamp(req, res, next) {
    req.app.U.logger.debug("addStamp started");
    let command, args;

    if (!req.body.stamp) {
      req.app.U.logger.debug("no stamp required, rename pre-stamp to output");
      command = "mv";
      args = [`${req.temp.name}/pre-stamp.pdf`, `${req.temp.name}/output.pdf`];
    } else {
      req.app.U.logger.debug("stamp each page");
      command = "pdftk";
      args = [
        `${req.temp.name}/pre-stamp.pdf`,
        "stamp",
        `${req.temp.name}/stamp.pdf`,
        "output",
        `${req.temp.name}/output.pdf`,
      ];
    }

    execa(command, args)
      .then(() => {
        req.app.U.logger.debug("addStamp complete");
        next();
      })
      .catch((err) => catchCmdlineError(err, next, req));
  },

  errorHandler(err, req, res, next) {
    if (req.method === "POST") {
      res.set("Content-Type", "application/json");
      res.status(500).send(`{"message": "${err.message}"}`);
    } else {
      next();
    }
  },
};
