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
  config = JSON.parse(fs.readFileSync(configFile))
} catch(err) {
  console.log(err)
  console.log('unable to read', configFile)
  process.exit(-1)
}

analyze(config, function(err, status) {
  if (err) {
    console.log(err)
    return
  }

  console.log(JSON.stringify(status, null, 2))
})

