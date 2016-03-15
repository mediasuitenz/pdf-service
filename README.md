# pdf-service

## Usage

This service currently has a single endpoint `/` which accepts a POST request.

The request body should be JSON with the following structure:
```
{
  "html": "<html string to be converted into pdf>",
  "attachments": [
    "<base64 string of first pdf to be appended to final pdf output",
    "<base64 string of second pdf to be appended to final pdf output"
  ]
}
```
The `attachments` key is optional.

The body size is currently limited to `50mb`.

The docker container exposes port 80 which should be forwarded to the node service which is listening on port 3000.

## Running the Docker image

```docker run -d -p 80:3000 mediasuite/pdf-service```
