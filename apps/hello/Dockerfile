# Hello Node
#
# VERSION 0.0.1

FROM dockerfile/nodejs
MAINTAINER Matteo Collina <hello@matteocollina.com>

# install tools for building binary addons
RUN apt-get -y update
RUN apt-get -y install build-essential libssl-dev curl python

RUN mkdir /db

ADD ./ /src

RUN cd /src; rm -rf node_modules/; npm install --unsafe-perm

EXPOSE 3000

ENTRYPOINT ["node", "/src/index", "3000"]
