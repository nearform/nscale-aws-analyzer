var async = require('async')
  , fetchInstances = require('./lib/ec2-instances')
  , fetchImages = require('./lib/ec2-amis')

function analyze(cb) {
  var result = {}

  async.series([

    function(cb) {
      fetchInstances(result, function(err) {
        if (err) { return cb(err) }

        cb(null)
      })
    },

    function(cb) {
      fetchImages(result, function(err) {
        if (err) { return cb(err) }

        cb(null)
      })
    }

  ], function(err) {
    cb(err, result)
  })
}

module.exports = analyze
