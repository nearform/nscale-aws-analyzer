
var AWS         = require('aws-sdk')
  , _           = require('lodash')
  , nameRegexp  = /\/?nfd[-:]([^-]+)-(.+)$/
  , uuid        = require('uuid')

function fetchLoadBalancers(config, namespaces, cb) {

  var elb           = new AWS.ELB()

    , instancesMap  = _.chain(namespaces)
                       .values()
                       .map(function(namespace) {
                         return _.values(namespace.topology.containers)
                       })
                       .flatten()
                       .filter(function(container) {
                         // this is an EC2 instance
                         return container.specific.instanceId
                       })
                       .reduce(function(acc, container) {
                         acc[container.specific.instanceId] = container
                         return acc
                       }, {})
                       .value()

  elb.describeLoadBalancers({}, function(err, data) {
    if (err) { return cb(err) }

    data.LoadBalancerDescriptions.forEach(function(elb) {

      var match = elb.LoadBalancerName.match(nameRegexp)

        , id
        , namespace

        , topologyContainers
        , containerDefinitions
        , def


      if (!match) {
        return
      }

      id = match[2]
      namespace = match[1]

      if (!namespaces[namespace]) {
        // TODO handle this condition better
        return cb(new Error('ELB with no instance'))
      }


      topologyContainers    = namespaces[namespace].topology.containers
      containerDefinitions  = namespaces[namespace].containerDefinitions

      def = {
          id: uuid.v1()
        , type: 'aws-elb'
      }

      containerDefinitions.push(def)

      topologyContainers[id] = {
          id: id
        , containerDefinitionId: def.id
        , contains: []
        , specific: {
          }
      }

      elb.Instances.forEach(function(instance) {
        instance = instancesMap[instance.InstanceId]

        topologyContainers[id].contains.push(instance.id)

        instance.containedBy = id
      })

    })

    cb()
  })
}

module.exports = fetchLoadBalancers
