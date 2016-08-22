#!/bin/bash

echo "======== Docker Build ========"
docker build -t mediasuite/pdf-service .

echo "========= Setup Tags ========="
version=$(date +%Y%m%d%H%M%S)
docker tag mediasuite/pdf-service:latest mediasuite/pdf-service:$version

echo "===== Push to Docker Hub ====="
docker push mediasuite/pdf-service:latest
docker push mediasuite/pdf-service:$version
