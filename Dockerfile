FROM nodesource/trusty:LTS
MAINTAINER Jonathan Prince <jonathan.prince@gmail.com>

RUN sed 's/main$/main universe/' -i /etc/apt/sources.list
RUN apt-get update
RUN apt-get upgrade -y

# Download and install wkhtmltopdf
RUN apt-get install -y build-essential xorg libssl-dev libxrender-dev wget gdebi
RUN wget http://download.gna.org/wkhtmltopdf/0.12/0.12.2/wkhtmltox-0.12.2_linux-trusty-amd64.deb
RUN gdebi --n wkhtmltox-0.12.2_linux-trusty-amd64.deb

# install ghostscript
RUN apt-get update && apt-get -y install ghostscript && apt-get clean

COPY ./* ./

CMD npm install && node .

EXPOSE 80
