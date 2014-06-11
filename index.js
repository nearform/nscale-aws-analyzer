var async = require('async')
  , fetchInstances = require('./lib/ec2-instances')
  , fetchImages = require('./lib/ec2-amis')
  , fetchContainers = require('./lib/docker-containers')
  , fetchLoadBalancers = require('./lib/elb')
  , debug = require('debug')('aws-analyzer:index')

function analyze(config, cb) {
  var result = {}

  debug('started')

  async.eachSeries([
      fetchInstances
    , fetchImages
    , fetchContainers
    , fetchLoadBalancers
  ], function(func, cb) {
    debug('calling', func.name)
    func(config, result, function(err) {
      if (err) { return cb(err) }

      debug('done', func.name)

      cb(null)
    })
  }, function(err) {
    cb(err, result)
  })
}

module.exports = analyze
