FROM ubuntu:xenial-20190425

LABEL maintainer="Jonathan Prince <jonathan.prince@gmail.com>"

# no tty
ARG DEBIAN_FRONTEND=noninteractive

RUN build_deps="apt-utils curl" \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
    $build_deps \
    ca-certificates \
    pdftk \
    fontconfig \
    libfreetype6 \
    libjpeg-turbo8 \
    libpng12-0 \
    libx11-6 \
    libxcb1 \
    libxext6 \
    libxrender1 \
    xfonts-75dpi \
    xfonts-base \
  && curl -sL https://deb.nodesource.com/setup_10.x -o nodesource_setup.sh \
  && bash nodesource_setup.sh \
  && apt-get install -y --no-install-recommends nodejs \
  && curl -sL https://github.com/wkhtmltopdf/wkhtmltopdf/releases/download/0.12.5/wkhtmltox_0.12.5-1.xenial_amd64.deb -o wkhtmltox_0.12.5-1.xenial_amd64.deb \
  && dpkg -i wkhtmltox_0.12.5-1.xenial_amd64.deb \
  && rm nodesource_setup.sh wkhtmltox_0.12.5-1.xenial_amd64.deb \
  && rm -rf /var/lib/apts/lists/* \
  && apt-get purge -y --auto-remove $build_deps \
  && mkdir -p /usr/src/app

WORKDIR /usr/src/app/

COPY package.json .

RUN npm install \
  && rm -rf ~/.npm/ /tmp/npm*

COPY . .

CMD ["node", "."]

EXPOSE 80
