'use strict';

var expect = require('must');
var _ = require('lodash');

var sampleSystem = require('./data/sample-system.json');
var sampleConfig = require('./data/sample-config.json');

var analyzer = require('../');

describe('analyze.js:', function() {
  var testSystem;
  var testConfig;
  var processExit;
  var exitResult;

  beforeEach(function() {
    testSystem = _.cloneDeep(sampleSystem);
    testConfig = _.cloneDeep(sampleConfig);
    processExit = process.exit;
    process.exit = function(code) {
      exitResult = code;
    };
  });

  afterEach(function() {
    process.exit = processExit;
    exitResult = 42;
  });

  it('should err (-1) on missing system', function(done) {
    var analyzer = require('../analyze.js');
    expect(exitResult).to.be.eql(-1);
    done();
  });
});
