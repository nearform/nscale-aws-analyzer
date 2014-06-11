var expect          = require('must')
  , fetchContainers = require('../lib/docker-containers')
  , helpers         = require('../lib/docker-helpers')
  , AWS             = require('aws-sdk')
  , sinon           = require('sinon')
  , fs              = require('fs')

describe('docker analysis', function() {
  var helperStub;

  afterEach(function() {
    helperStub.restore()
  })

  it('must define the containers and the containersDefinition', function() {
    var containers  = JSON.parse(fs.readFileSync(__dirname + '/fixture/1-docker-containers.json'))
      , images      = JSON.parse(fs.readFileSync(__dirname + '/fixture/1-docker-images.json'))

    helperStub = sinon.stub(helpers, 'tunnelAndFetch')

    helperStub.yields(null, containers, images)

    var expected = {
      "mcollina": {
        "namespace": "mcollina",
        "containerDefinitions": [
          {
            "id": "ami-fb8e9292",
            "type": "aws-ami",
            "specific": {
              "notManaged": true
            }
          },
          {
            "id": "dfb12710-f0b6-11e3-9836-19909b9493cf",
            "type": "docker",
            "specific": {
              "imageId": "8cf62d312f549778a1de4f016aced846a72e1db13bced13b4722336f092f8d33"
            }
          }
        ],
        "topology": {
          "containers": {
            "instance1": {
              "id": "instance1",
              "containerDefinitionId": "ami-fb8e9292",
              "contains": ["dfb12711-f0b6-11e3-9836-19909b9493cf"],
              "specific": {
                "imageId": "ami-fb8e9292",
                "instanceId": "i-f2bbc5a1",
                "publicIpAddress": "54.198.3.251",
                "privateIpAddress": "10.185.235.8"
              }
            },
            "dfb12711-f0b6-11e3-9836-19909b9493cf": {
              "id": "dfb12711-f0b6-11e3-9836-19909b9493cf",
              "containedBy": "instance1",
              "containerDefinitionId": "dfb12710-f0b6-11e3-9836-19909b9493cf",
              "specific": {
                "imageId": "nfd:mcollina-dfb12710-f0b6-11e3-9836-19909b9493cf",
                "containerId": "84a0a92a455d618ba53b962c6e133b616cd898cd2561f3d3c232a3860c2f4e3e"
              }
            }
          }
        }
      }
    }

    var result = {
      "mcollina": {
        "namespace": "mcollina",
        "containerDefinitions": [
          {
            "id": "ami-fb8e9292",
            "type": "aws-ami",
            "specific": {
              "notManaged": true
            }
          }
        ],
        "topology": {
          "containers": {
            "instance1": {
              "id": "instance1",
              "containerDefinitionId": "ami-fb8e9292",
              "specific": {
                "imageId": "ami-fb8e9292",
                "instanceId": "i-f2bbc5a1",
                "publicIpAddress": "54.198.3.251",
                "privateIpAddress": "10.185.235.8"
              }
            }
          }
        }
      }
    }

    fetchContainers({}, result, function(err) {
      expect(err).to.be.falsy()
      delete result.mcollina.id
      delete result.mcollina.name
      expect(result).to.eql(expected)
    })
  })
})
