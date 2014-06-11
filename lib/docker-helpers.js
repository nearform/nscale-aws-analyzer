var dig         = require('ssh-mole')
  , async       = require('async')
  , Docker      = require('dockerode')

function tunnelAndFetch(params, cb) {
  params.remotePort = params.remotePort || 3000

  dig(params, function(err, control) {
    if (err) {
      return cb(err)
    }

    fetch(control.port, function(err, containers, images) {
      control.done()

      if (err) {
        return cb(err)
      }

      cb(null, containers, images)
    })
  })
}

function fetch(port, cb) {
  var docker = new Docker({host: 'http://localhost', port: port});
  async.parallel([
      docker.listContainers.bind(docker)
    , docker.listImages.bind(docker)
  ], function(err, results) {
    if (err) { return cb(err) }

    cb(null, results[0], results[1])
  });
}

module.exports.tunnelAndFetch = tunnelAndFetch;
