'use strict';

var expect = require('must');
var _ = require('lodash');

var createBaseResult = require('../lib/createBaseResult.js');
var sampleConfig = require('./data/sample-config.json');
var sampleSystem = require('./data/sample-system.json');

describe('createBaseResult.js:', function() {
  var testConfig;
  var testSystem;

  beforeEach(function() {
    testConfig = _.cloneDeep(sampleConfig);
    testSystem = _.cloneDeep(sampleSystem);
  });

  it('should err on missing both system and config', function() {
    createBaseResult(null, null, function(err) {
      expect(err).to.be.truthy();
    });
  });


  it('should not err on missing config with valid system', function() {
    createBaseResult(null, testSystem, function(err, result) {
      expect(err).to.be.falsy();
      expect(result).to.be.truthy();
    });
  });

  it('should not err on missing system with valid config', function() {
    createBaseResult(testConfig, null, function(err, result) {
      expect(err).to.be.falsy();
      expect(result).to.be.truthy();
    });
  });

  it('should prefer system fields over config fields', function() {
    createBaseResult(testConfig, testSystem, function(err, result) {
      expect(err).to.be.falsy();
      expect(result).to.be.truthy();

      expect(result.name).to.be.eql(testSystem.name);
      expect(result.namespace).to.be.eql(testSystem.namespace);
      expect(result.id).to.be.eql(testSystem.systemId);
      expect(result.topology.name).to.be.eql(testSystem.topology.name);
    });
  });

  it('should have a null topology.name if none was found in system', function() {
    createBaseResult(testConfig, null, function(err, result) {
      expect(err).to.be.falsy();
      expect(result).to.be.truthy();
      expect(result.topology.name).to.be.eql(null);
    });
  });

  it('should err if missing name in both system and config', function() {
    delete testConfig.name;
    delete testSystem.name;

    createBaseResult(testConfig, testSystem, function(err, result) {
      expect(err).to.be.truthy();
    });
  });

  it('should err if missing namespace in both system and config', function() {
    delete testConfig.namespace;
    delete testSystem.namespace;

    createBaseResult(testConfig, testSystem, function(err, result) {
      expect(err).to.be.truthy();
    });
  });

  it('should err if missing systemId in both system and config', function() {
    delete testConfig.systemId;
    delete testSystem.systemId;

    createBaseResult(testConfig, testSystem, function(err, result) {
      expect(err).to.be.truthy();
    });
  });

  it('modifications to system should not leak', function() {
    var system = null;

    createBaseResult(testConfig, system, function(err, result) {
      expect(system).to.be.null();
    });
  });
});