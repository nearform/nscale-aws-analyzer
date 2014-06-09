#!/usr/bin/env node

var fs          = require('fs')
  , configFile  = process.argv[2]
  , analyze     = require('./')
  , AWS         = require('aws-sdk')
  , config

if (!configFile) {
  console.log('Missing config')
  process.exit(-1)
}

try {
  AWS.config.loadFromPath(configFile)
} catch(err) {
  console.log(err)
  console.log('unable to read', configFile)
  process.exit(-1)
}

analyze(function(err, status) {
  if (err) {
    console.log(err)
    process.exit(1)
  }

  console.log(JSON.stringify(status, null, 2))
})

