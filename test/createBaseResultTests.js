'use strict';

var expect = require('must');
var _ = require('lodash');

var createBaseResult = require('../lib/createBaseResult.js');
var sampleSystem = require('./data/sample-system.json');
var sampleSystemNoTop = require('./data/sample-notopology.json');

describe('createBaseResult.js:', function() {
  var testSystem;

  beforeEach(function() {
    testSystem = _.cloneDeep(sampleSystem);
  });

  it('should err on missing system', function(done) {
    createBaseResult(null, function(err, result) {
      expect(err).to.be.truthy();
      expect(result).to.be.falsy();
      done();
    });
  });


  it('should not err on valid system', function(done) {
    createBaseResult(testSystem, function(err, result) {
      expect(err).to.be.falsy();
      expect(result).to.be.truthy();
      done();
    });
  });

  it('should have a null topology.name if none was found in system', function(done) {
    createBaseResult(sampleSystemNoTop, function(err, result) {
      expect(err).to.be.falsy();
      expect(result).to.be.truthy();
      expect(result.topology.name).to.be.eql(null);
      done();
    });
  });

  it('should err if missing name in system', function(done) {
    delete testSystem.name;

    createBaseResult(testSystem, function(err, result) {
      expect(err).to.be.truthy();
      expect(result).to.be.falsy();
      done();
    });
  });

  it('should err if missing namespace in system', function(done) {
    delete testSystem.namespace;

    createBaseResult(testSystem, function(err, result) {
      expect(err).to.be.truthy();
      expect(result).to.be.falsy();
      done();
    });
  });

  it('should err if missing systemId in system', function(done) {
    delete testSystem.id;

    createBaseResult(testSystem, function(err, result) {
      expect(err).to.be.truthy();
      expect(result).to.be.falsy();
      done();
    });
  });
});
