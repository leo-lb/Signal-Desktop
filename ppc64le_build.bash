#!/bin/bash

set -eux

VERSION=v10.13.0
DISTRO=linux-ppc64le

wget "https://nodejs.org/dist/$VERSION/node-$VERSION-$DISTRO.tar.xz"
tar -xJvf node-$VERSION-$DISTRO.tar.xz
PATH=$(pwd)/node-$VERSION-$DISTRO/bin:$PATH

sudo npm install -g yarn gulp electron-rebuild

yarn install
yarn grunt
yarn icon-gen
