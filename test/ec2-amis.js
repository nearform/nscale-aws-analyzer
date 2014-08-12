'use strict';

var expect          = require('must');
var fetchImages     = require('../lib/ec2-amis');
var AWS             = require('aws-sdk');
var sinon           = require('sinon');
var fs              = require('fs');


describe('ec2 instances analysis', function() {
  var constructorStub;

  afterEach(function() {
    constructorStub.restore();
  });

  it('must fetch a non-managed ami', function() {
    constructorStub = sinon.stub(AWS, 'EC2');

    constructorStub.returns({
      describeImages: function(params, cb) {
        cb(null, JSON.parse(fs.readFileSync(__dirname + '/fixture/1-ec2-images.json')));
      }
    });

    var expected = {
      'namespace': 'mcollina',
      'containerDefinitions': [
        {
          'id': 'ami-fb8e9292',
          'type': 'aws-ami',
          'nativeId': 'ami-fb8e9292',
          'specific': {}
        }
      ],
      'topology': {
        'containers': {
          'instance1': {
            'id': 'instance1',
            'containerDefinitionId': 'ami-fb8e9292',
            'specific': {
              'imageId': 'ami-fb8e9292',
              'instanceId': 'i-f2bbc5a1',
              'publicIpAddress': '54.198.3.251',
              'privateIpAddress': '10.185.235.8'
            }
          }
        }
      }
    };

    var result = {
      'namespace': 'mcollina',
      'containerDefinitions': [
      ],
      'topology': {
        'containers': {
          'instance1': {
            'id': 'instance1',
            'specific': {
              'imageId': 'ami-fb8e9292',
              'instanceId': 'i-f2bbc5a1',
              'publicIpAddress': '54.198.3.251',
              'privateIpAddress': '10.185.235.8'
            }
          }
        }
      }
    };

    fetchImages(AWS, {}, result, function(err) {
      expect(err).to.be.falsy();
      delete result.id;
      delete result.name;
      expect(result).to.eql(expected);
    });
  });



  it('must fetch a managed ami', function() {
    constructorStub = sinon.stub(AWS, 'EC2');

    constructorStub.returns({
      describeImages: function(params, cb) {
        cb(null, JSON.parse(fs.readFileSync(__dirname + '/fixture/2-ec2-images.json')));
      }
    });

    var expected = {
      'namespace': 'mcollina',
      'containerDefinitions': [
        {
          'id': 'ami1',
          'type': 'aws-ami',
          'nativeId': 'ami-fb8e9292',
          'specific': {}
        }
      ],
      'topology': {
        'containers': {
          'instance1': {
            'id': 'instance1',
            'containerDefinitionId': 'ami1',
            'specific': {
              'imageId': 'ami-fb8e9292',
              'instanceId': 'i-f2bbc5a1',
              'publicIpAddress': '54.198.3.251',
              'privateIpAddress': '10.185.235.8'
            }
          }
        }
      }
    };

    var result = {
      'namespace': 'mcollina',
      'containerDefinitions': [
      ],
      'topology': {
        'containers': {
          'instance1': {
            'id': 'instance1',
            'specific': {
              'imageId': 'ami-fb8e9292',
              'instanceId': 'i-f2bbc5a1',
              'publicIpAddress': '54.198.3.251',
              'privateIpAddress': '10.185.235.8'
            }
          }
        }
      }
    };

    fetchImages(AWS, {}, result, function(err) {
      expect(err).to.be.falsy();
      delete result.id;
      delete result.name;
      expect(result).to.eql(expected);
    });
  });
});

