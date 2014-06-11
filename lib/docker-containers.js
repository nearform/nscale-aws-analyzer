var async       = require('async')
  , _           = require('lodash')
  , helpers     = require('./docker-helpers')
  , nameRegexp  = /\/?nfd[-:]([^-]+)-(.+)$/

function fetchContainers(options, namespaces, done) {
  async.each(_.values(namespaces), function(namespace, cb) {
    var topologyContainers    = namespace.topology.containers
      , containerDefinitions  = namespace.containerDefinitions

    async.each(_.values(topologyContainers), function(ec2instance, cb) {
      helpers.tunnelAndFetch({
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
            , containedBy: ec2instance.id
            , specific: {
                  imageId: container.Image
                , containerId: container.Id
              }
          }

          ec2instance.contains = ec2instance.contains || []
          ec2instance.contains.push(id)
        })

        cb()
      })
    }, cb)
  }, function(err) {
    if (err) { return done(err) }

    done()
  })
}

module.exports = fetchContainers
