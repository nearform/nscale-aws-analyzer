var expect          = require('must')
  , fetchImages     = require('../lib/ec2-amis')
  , AWS             = require('aws-sdk')
  , sinon           = require('sinon')
  , fs              = require('fs')

describe('ec2 instances analysis', function() {
  var constructorStub;

  beforeEach(function() {
    constructorStub = sinon.stub(AWS, 'EC2')

    constructorStub.returns({
      describeImages: function(params, cb) {
        cb(null, JSON.parse(fs.readFileSync(__dirname + '/fixture/1-ec2-images.json')))
      }
    })
  })

  afterEach(function() {
    constructorStub.restore()
  })

  it('must fetch a non-managed ami', function() {
    var expected = {
      "mcollina": {
        "namespace": "mcollina",
        "containerDefinitions": [
          {
            "id": "ami-fb8e9292",
            "type": "ami",
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

    var result = {
      "mcollina": {
        "namespace": "mcollina",
        "containerDefinitions": [
        ],
        "topology": {
          "containers": {
            "instance1": {
              "id": "instance1",
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

    fetchImages(result, function(err) {
      expect(err).to.be.falsy()
      delete result.mcollina.id
      delete result.mcollina.name
      expect(result).to.eql(expected)
    })
  })
})
