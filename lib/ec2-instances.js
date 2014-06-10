
var uuid  = require('uuid')
  , AWS   = require('aws-sdk')
  , _     = require('lodash')

function fetchInstances(result, cb) {

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

  var ec2 = new AWS.EC2()
    , filters = [{
          Name: "instance-state-code"
        , Values: ["16"] // only running instances
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

module.exports = fetchInstances
