
var AWS   = require('aws-sdk')
  , _     = require('lodash')

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

module.exports = fetchImages
