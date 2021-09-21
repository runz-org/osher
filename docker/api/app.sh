#!/bin/sh
yarn install --prod || exit $?
yarn start http
