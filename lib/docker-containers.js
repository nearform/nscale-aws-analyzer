var dig         = require('ssh-mole')
  , Docker      = require('dockerode')
  , async       = require('async')
  , _           = require('lodash')
  , nameRegexp  = /\/nfd[-:]([^-]+)-(.+)$/

function addContainers(options, namespaces, done) {
  async.each(_.values(namespaces), function(namespace, cb) {
    var topologyContainers    = namespace.topology.containers
      , containerDefinitions  = namespace.containerDefinitions

    async.each(_.values(topologyContainers), function(ec2instance, cb) {
      tunnelAndFetch({
          user: options.user
        , host: ec2instance.specific.publicIpAddress
        , identityFile: options.identityFile
      }, function(err, containers, images) {
        if (err) { return cb(err) }

        var imageIdToNfdId = {}

        images.forEach(function(image) {
          var match = image.RepoTags.reduce(function(acc, tag) {
                        if (acc) return acc
                        return tag.match(nameRegexp)
                      }, null)

            , id
            , def



          if (!match) {
            return
          }

          id = match[2]

          def = {
              id: id
            , specific: {
                  imageId: image.Id
              }
          }

          containerDefinitions.push(def)

          imageIdToNfdId[image.Id] = id
        })

        containers.forEach(function(container) {

          var match = container.Names[0].match(nameRegexp)
            , id

          if (!match) {
            return
          }

          id = match[2]

          topologyContainers[id] = {
              id: id
            , containerDefinitions: imageIdToNfdId[container.Image]
            , specific: {
                  imageId: container.Image
                , containerId: container.Id
              }
          }
        })

        cb()
      })
    }, cb)
  }, function(err) {
    if (err) { return done(err) }

    done()
  })
}

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


module.exports = addContainers
