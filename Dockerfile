FROM nodesource/trusty:LTS

MAINTAINER Jonathan Prince <jonathan.prince@gmail.com>

# no tty
ARG DEBIAN_FRONTEND=noninteractive

RUN sed 's/main$/main universe/' -i /etc/apt/sources.list

# Install ghostscript, download and install wkhtmltopdf
RUN build_deps="build-essential xorg libssl-dev libxrender-dev wget gdebi" \
  && apt-get update \
  && apt-get install -y --force-yes --no-install-recommends $build_deps ghostscript \
  && wget http://download.gna.org/wkhtmltopdf/0.12/0.12.2/wkhtmltox-0.12.2_linux-trusty-amd64.deb \
  && gdebi --n wkhtmltox-0.12.2_linux-trusty-amd64.deb \
  && rm -f wkhtmltox-0.12.2_linux-trusty-amd64.deb \
  && rm -rf /var/lib/apt/lists/* \
  && apt-get purge -y --auto-remove $build_deps

COPY . .

RUN npm install

CMD node .

EXPOSE 80
