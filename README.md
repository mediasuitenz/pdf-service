# pdf-service

## Usage

To use the service send a POST request to `/`.

The request body should be JSON with the following structure:

```
{
  "html": "<html string to be converted into pdf>",
  "attachments": [
    "<URL or base64 string of first pdf to be appended to final pdf output>",
    "<URL or base64 string of second pdf to be appended to final pdf output>"
  ],
  "stamp": "html string for stamping each page of merged pdf"
}
```

The `attachments` and `stamp` keys are optional, URL must include protocol `http(s):`.

The default body size limits to a maximum of `50mb`.

The docker container exposes port 80 which should be forwarded to the node service which is listening on port 3000.

To check if the service is running, send a GET request to `/ping`.

## Building the Docker image

`docker build -t mediasuite/pdf-service:<version_tag> .`

You can build and push to Docker Hub with a timestamped tag with the following command:

`npm run docker`

This will also push a matching image with the `latest` tag.

## Running the Docker image

`docker run -d -p 80:3000 mediasuite/pdf-service:<version_tag>`

### Overriding defaults when starting the Docker image

The default command that is used when starting the docker image as above will be `node .`, this can be overridden by specifying the command when running the image. Example:

`docker run -d -p 80:3000 mediasuite/pdf-service:<version_tag> node . --limit=150mb`

This starts the image and runs the app setting the max. body size to 150mb.

## Running locally without Docker

This module can of course be run locally without Docker, however you will need to install the following dependencies:

- **wkhtmltopdf**
- **pdftk**

After pulling down this repo and running `npm install` you can start the service using default settings with `node .`, there are currently three optional args `--port`, `--limit`, and `--loglevel` for setting the port to listen on, maximum allowed body size for the request, and the log level.

Example: `node . --port 3333 --limit 100mb` // sets the port to 3333 and max. body size to 100mb
