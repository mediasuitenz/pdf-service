FROM nodesource/trusty:LTS

LABEL maintainer="Jonathan Prince <jonathan.prince@gmail.com>"

# no tty
ARG DEBIAN_FRONTEND=noninteractive

RUN sed 's/main$/main universe/' -i /etc/apt/sources.list

# Install pdftk, download and install wkhtmltopdf
RUN build_deps="build-essential xorg libssl-dev libxrender-dev wget gdebi" \
  && apt-get update \
  && apt-get install -y --force-yes --no-install-recommends $build_deps pdftk \
  && wget https://github.com/wkhtmltopdf/wkhtmltopdf/releases/download/0.12.2.1/wkhtmltox-0.12.2.1_linux-trusty-amd64.deb \
  && gdebi --n wkhtmltox-0.12.2.1_linux-trusty-amd64.deb \
  && rm -f wkhtmltox-0.12.2.1_linux-trusty-amd64.deb \
  && rm -rf /var/lib/apts/lists/* \
  && apt-get purge -y --auto-remove $build_deps

COPY package.json .

RUN npm install \
  && rm -rf \
    ~/.node-gyp \
    ~/.npm \
    /tmp/*

COPY . .

CMD ["node", "."]

EXPOSE 80
