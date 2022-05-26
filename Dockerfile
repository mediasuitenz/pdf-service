FROM node:10.24.1-stretch-slim

LABEL maintainer="Media Suite <developers@mediasuite.co.nz>"

# no tty
ARG DEBIAN_FRONTEND=noninteractive

# hadolint ignore=DL3008,SC2086
RUN build_deps="apt-utils curl" \
  && apt-get update \
  && apt-get upgrade -y \
  && apt-get install -y --no-install-recommends \
     $build_deps \
     ca-certificates \
     pdftk \
     fontconfig \
     libfreetype6 \
     libjpeg62-turbo \
     libpng16-16 \
     libx11-6 \
     libxcb1 \
     libxext6 \
     libxrender1 \
     xfonts-75dpi \
     xfonts-base \
   && curl -OsL https://github.com/wkhtmltopdf/packaging/releases/download/0.12.6-1/wkhtmltox_0.12.6-1.stretch_amd64.deb \
   && dpkg -i wkhtmltox_0.12.6-1.stretch_amd64.deb \
   && rm wkhtmltox_0.12.6-1.stretch_amd64.deb \
   && rm -rf /var/lib/apts/lists/* \
   && apt-get purge -y --auto-remove $build_deps \
   && mkdir -p /app

WORKDIR /app/

COPY package.json .

RUN npm install \
  && rm -rf ~/.npm/ /tmp/npm*

COPY . .

CMD ["node", "."]

ENTRYPOINT ["/app/docker-entrypoint.sh"]

EXPOSE 3000
