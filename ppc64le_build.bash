#!/bin/bash

set -eux

VERSION=v10.13.0
DISTRO=linux-ppc64le

wget "https://nodejs.org/dist/$VERSION/node-$VERSION-$DISTRO.tar.xz"
tar -xJvf node-$VERSION-$DISTRO.tar.xz
PATH=$(pwd)/node-$VERSION-$DISTRO/bin:$PATH

which yarn || sudo npm install -g yarn 
which gulp || sudo npm install -g gulp
which electron-build || sudo npm install -g electron-rebuild

yarn install
yarn grunt
