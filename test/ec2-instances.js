'use strict';

var expect          = require('must');
var fetchInstances  = require('../lib/ec2-instances');
var AWS             = require('aws-sdk');
var sinon           = require('sinon');
var fs              = require('fs');

describe('ec2 instances analysis', function() {
  var constructorStub;

  beforeEach(function() {
    constructorStub = sinon.stub(AWS, 'EC2');

    constructorStub.returns({
      describeInstances: function(params, cb) {
        cb(null, JSON.parse(fs.readFileSync(__dirname + '/fixture/1-ec2-instances.json')));
      }
    });
  });

  afterEach(function() {
    constructorStub.restore();
  });

  it('must fetch two containers', function() {
    var expected = {
      'namespace': 'mcollina',
      'containerDefinitions': [],
      'topology': {
        'containers': {
          'instance1': {
            'id': 'instance1',
            'nativeId': 'i-f2bbc5a1',
            'type': 'aws-instance',
            'contains': [],
            'specific': {
              'imageId': 'ami-fb8e9292',
              'instanceId': 'i-f2bbc5a1',
              'publicIpAddress': '54.198.3.251',
              'privateIpAddress': '10.185.235.8'
            }
          },
          'instance2': {
            'id': 'instance2',
            'nativeId': 'i-cea2dc9d',
            'type': 'aws-instance',
            'contains': [],
            'specific': {
              'imageId': 'ami-fb8e9292',
              'instanceId': 'i-cea2dc9d',
              'publicIpAddress': '184.73.96.113',
              'privateIpAddress': '10.155.178.230'
            }
          }
        }
      }
    };

    var result = {'namespace': 'mcollina',
                  'containerDefinitions': [], 
                  'topology': { 'containers': {}}}; 

    fetchInstances(AWS, {'instanceFilter': 'nfd-id'}, result, function(err) {
      expect(err).to.be.falsy();
      delete result.id;
      delete result.name;
      expect(result).to.eql(expected);
    });
  });
});

