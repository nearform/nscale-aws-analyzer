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

  it.skip('must fetch two containers', function() {
    var expected = {
      'namespace': 'mcollina',
      'containerDefinitions': [],
      'topology': {
        'containers': {
          'i-cea2dc9d': {
            'id': 'i-cea2dc9d',
            'name': 'i-cea2dc9d',
            'nativeId': 'i-cea2dc9d',
            'type': 'aws-instance',
            'contains': [],
            'specific': {
              'instanceId': 'i-cea2dc9d',
              'privateIpAddress': '10.155.178.230',
              'publicIpAddress': '184.73.96.113',
              'securityGroups': [{'GroupId': 'sg-bc65cad6',
                                  'GroupName': 'launch-wizard-2'}],
              'tags': [{'Key': 'Name',
                        'Value': 'mcollina-test2'},
                       {'Key': 'nfd-id',
                        'Value': 'instance2'},
                       {'Key': 'nfd-namespace',
                        'Value': 'mcollina'}]
              }
            }
          },
          'instance2': {
            'id': 'instance2',
            'nativeId': 'i-cea2dc9d',
            'type': 'aws-instance',
            'name': 'i-cea2dc9d',
            'contains': [],
            'specific': {
              'instanceId': 'i-cea2dc9d',
              'publicIpAddress': '184.73.96.113',
              'privateIpAddress': '10.155.178.230'
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

