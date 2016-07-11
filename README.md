# pdf-service

## Usage

This service currently has a single endpoint `/` which accepts a POST request.

The request body should be JSON with the following structure:
```
{
  "html": "<html string to be converted into pdf>",
  "attachments": [
    "<base64 string of first pdf to be appended to final pdf output>",
    "<base64 string of second pdf to be appended to final pdf output>"
  ],
  "stamp": {
    "lineOne": "<first line of footer stamp>",
    "lineTwo": "<second line of footer stamp>"
  }
}
```
The `attachments` and `stamp` keys are optional.

The default body size limits to a maximum of `50mb`.

The docker container exposes port 80 which should be forwarded to the node service which is listening on port 3000.

## Building the Docker image

`docker build -t mediasuite/pdf-service:<version_tag> .`

## Running the Docker image

`docker run -d -p 80:3000 mediasuite/pdf-service:<version_tag>`

## Running locally without Docker

This module can of course be run locally without Docker, however you will need to install the following dependencies:

 - **wkhtmltopdf**
 - **ghostscript**

After pulling down this repo and running `npm install` you can start the service using default settings with `node .`, there are currently two optional args `--port` and `--limit` for setting the port to listen on and maximum allowed body size for the request.

Example: `node . --port 3333 --limit 100mb` // sets the port to 3333 and max. body size to 100mb
