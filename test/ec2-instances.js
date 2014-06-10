
var expect          = require('must')
  , fetchInstances  = require('../lib/ec2-instances')
  , AWS             = require('aws-sdk')
  , sinon           = require('sinon')
  , fs              = require('fs')

describe('ec2 instances analysis', function() {
  var constructorStub;

  beforeEach(function() {
    constructorStub = sinon.stub(AWS, 'EC2')

    constructorStub.returns({
      describeInstances: function(params, cb) {
        cb(null, JSON.parse(fs.readFileSync(__dirname + '/fixture/1-ec2-instances.json')))
      }
    })
  })

  afterEach(function() {
    constructorStub.restore()
  })

  it('must fetch two containers', function() {
    var expected = {
      "mcollina": {
        "namespace": "mcollina",
        "containerDefinitions": [],
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
            },
            "instance2": {
              "id": "instance2",
              "specific": {
                "imageId": "ami-fb8e9292",
                "instanceId": "i-cea2dc9d",
                "publicIpAddress": "184.73.96.113",
                "privateIpAddress": "10.155.178.230"
              }
            }
          }
        }
      }
    }

    var result = {}

    fetchInstances({}, result, function(err) {
      expect(err).to.be.falsy()
      delete result.mcollina.id
      delete result.mcollina.name
      expect(result).to.eql(expected)
    })
  })

  it('must add an id to the namespace', function() {
    var result = {}

    fetchInstances({}, result, function(err) {
      expect(err).to.be.falsy()
      expect(result.mcollina.id).to.be.a.string()
      expect(result.mcollina.id).to.have.length(36)
    })
  })
})
