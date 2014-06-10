var sshTunnel   = require('./ssh-tunnel')
  , Docker      = require('dockerode')
  , async       = require('async')
  , _           = require('lodash')
  , portfinder  = require('portfinder')
  , nameRegexp  = /\/nfd-([^-]+)-([^-]+)/

function addContainers(options, namespaces, done) {
  async.each(_.values(namespaces), function(namespace, cb) {
    var topologyContainers = namespace.topology.containers
    async.each(_.values(topologyContainers), function(ec2instance, cb) {
      portfinder.getPort(function(err, port) {
        tunnelAndFetch({
            localPort: port
          , user: options.user
          , host: ec2instance.specific.publicIpAddress
          , identityFile: options.identityFile
        }, function(err, containers) {
          if (err) { return cb(err) }

          containers.forEach(function(container) {

            var match = container.Names[0].match(nameRegexp)
              , id

            if (!match) {
              return
            }

            id = match[2]

            topologyContainers[id] = {
                id: id
              , specific: {
                    imageId: container.Image
                  , containerId: container.Id
                }
            }
          })

          cb()
        })
      })
    }, cb)
  }, function(err) {
    if (err) { return done(err) }

    done()
  })
}

function tunnelAndFetch(params, cb) {
  params.remotePort = params.remotePort || 3000

  sshTunnel(params, function(err, control) {
    if (err) {
      return cb(err)
    }

    fetchContainers(control.port, function(err, containers) {
      control.done()

      if (err) {
        return cb(err)
      }

      cb(null, containers)
    })
  })
}

function fetchContainers(port, cb) {
  var docker = new Docker({host: 'http://localhost', port: port});
  docker.listContainers(function (err, containers) {
    if (err) { return fetchInstances(cb) }
    cb(null, containers)
  });
}


module.exports = addContainers
