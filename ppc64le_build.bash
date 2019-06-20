#!/bin/bash

set -eux

VERSION=v10.13.0
DISTRO=linux-ppc64le

wget "https://nodejs.org/dist/$VERSION/node-$VERSION-$DISTRO.tar.xz"
tar -xJvf node-$VERSION-$DISTRO.tar.xz
PATH=$(pwd)/node-$VERSION-$DISTRO/bin:$PATH

which yarn || sudo npm install -g yarn
which gulp || sudo npm install -g gulp
which electron-rebuild || sudo npm install -g electron-rebuild

OLDDIR="$(pwd)"

echo "#######################"
echo "Signal needs svg2png which requires phantomjs, we're going to compile it from source."
echo "It needs several build dependencies, check for them here: http://phantomjs.org/build.html"
echo "Please note that it requires OpenSSL 1.0"
echo "For a recent Fedora system, run: sudo yum dnf gcc gcc-c++ make flex bison gperf ruby compat-openssl10-devel.ppc64le freetype-devel fontconfig-devel libicu-devel sqlite-devel libpng-devel libjpeg-devel"
echo "#######################"

cd /tmp
git clone git://github.com/ariya/phantomjs.git
cd phantomjs
git checkout 2.1.1
git submodule init
git submodule update

CXXFLAGS="-fpermissive" python build.py

PATH="$(pwd)/bin:$PATH"

cd "$OLDDIR"

yarn install
yarn grunt
yarn icon-gen
