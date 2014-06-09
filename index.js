var uuid  = require('uuid')
  , AWS   = require('aws-sdk')
  , async = require('async')
  , _     = require('lodash')

function analyze(cb) {

  var result = {}

  function fetchStatus(namespace) {

    if (result[namespace])
      return result[namespace]

    var status = {
          "name": namespace + " status on " + new Date().toISOString()
        , "namespace": namespace
        , "id": uuid.v1()
        , "containerDefinitions": []
        , "topology": {
              "containers": {}
          }
      }

    result[namespace] = status

    return status
  }

  async.series([

    function(cb) {
      fetchEC2(fetchStatus, function(err) {
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

function fetchEC2(fetchStatus, cb) {
  var ec2 = new AWS.EC2()
    , filters = [{
          Name: "instance-state-code"
        , Values: ["16"]
      }]

    , params  = {
          Filters: filters
      }

  ec2.describeInstances(params, function(err, data) {
    if (err) { return cb(err) }


    data.Reservations.forEach(function(reservation) {
      reservation.Instances.forEach(function(instance) {
        var id
          , namespace
          , containers

        instance.Tags.forEach(function(tag) {
          switch(tag.Key) {
            case 'nfd-id':
              id = tag.Value
              break;

            case 'nfd-namespace':
              namespace = tag.Value
              break;
          }
        })

        if (!id || !namespace) {
          return
        }

        containers = fetchStatus(namespace).topology.containers

        containers[id] = {
            id: id
          , specific: {
                imageId: instance.ImageId
              , instanceId: instance.InstanceId
              , publicIpAddress: instance.PublicIpAddress
              , privateIpAddress: instance.PrivateIpAddress
            }
        }
      })
    })

    cb()
  })
}

function fetchImages(namespaces, cb) {

  var ec2 = new AWS.EC2()

    , imagesMap = {}

    , imageIds = _.chain(namespaces)
                  .values()
                  .map(function(namespace) {
                    return _.values(namespace.topology.containers)
                  })
                  .flatten()
                  .map(function(instance) {
                    return instance.specific.imageId
                  })
                  .uniq()
                  .value()

    , params  = {
          ImageIds: imageIds
      }

   _.chain(namespaces)
    .values()
    .forEach(function(namespace) {
      _.chain(namespace.topology.containers)
       .forEach(function(container) {
         var imageId = container.specific.imageId
         if (!imagesMap[imageId])
           imagesMap[imageId] = []
         imagesMap[imageId].push(namespace)
         imagesMap[imageId] = _.uniq(imagesMap[imageId])
       })
    })

  ec2.describeImages(params, function(err, data) {
    if (err) { return cb(err) }

    data.Images.forEach(function(image) {
      // if an AMI is a stock one
      // and not managed by nfd
      // lets use the AWS ImageId
      var id          = image.ImageId
        , notManaged  = true

      image.Tags.forEach(function(tag) {
        switch(tag.Key) {
          case 'nfd-id':
            notManaged = false
            id = tag.Value
          break;
        }
      })

      imagesMap[image.ImageId].forEach(function(namespace) {
        namespace.containerDefinitions.push({
            id: id
          , type: 'ami'
          , specific: {
                notManaged: notManaged
            }
        })
      })
    })

    cb();
  })
}

module.exports = analyze
