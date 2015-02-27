/*
 * THIS SOFTWARE IS PROVIDED ``AS IS'' AND ANY EXPRESSED OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED.  IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
 * STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
 * IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';

var async = require('async');
var AWS = require('aws-sdk');

var createBaseResult = require('./lib/createBaseResult.js');
var fetchInstances = require('./lib/ec2-instances');
var fetchImages = require('./lib/ec2-amis');
var fetchSecurityGroups = require('./lib/ec2-sgs');
var dockerAnalyzer = require('nscale-docker-ssh-analyzer');
var stripExtraneous = require('./lib/stripExtraneous');
var fetchLoadBalancers = require('./lib/elb');
var postProcessing = require('./lib/postProcessing');
var match = require('./lib/match');
var allowedTypes = [
  'docker',
  'blank-container'
];

exports.analyze = function analyze(config, system, callback) {
  system = system || {
    topology: {}
  };

  createBaseResult(config, system, function(err, result) {
    if (err) return callback(err, result);

    AWS.config.update(config);

    var onNext = function(func, done) {
      func(config, result, done);
    };

    var complete = function(err) {
      callback(err, result);
    };

    var series = [
      fetchInstances,
      fetchImages,
      fetchSecurityGroups,
      dockerAnalyzer(config, system),
      stripExtraneous,
      fetchLoadBalancers,
      postProcessing,
      match(system)
    ];

    async.eachSeries(series, onNext, complete);
  });
};

/**
 * Checks if this analyzer can analyze the given system.
 * A direct-analyzer can analyze if it contains docker or process
 * containers, and blank-containers with an IP address.
 *
 */
exports.canAnalyze = function canAnalyze(system) {

  var allAllowed = system.containerDefinitions.every(function(def) {
    return allowedTypes.indexOf(def.type) >= 0 || def.type.indexOf('aws') === 0;
  });

  var isAWS = system.containerDefinitions.some(function(def) {
    return def.type.indexOf('aws') === 0;
  });

  return allAllowed && isAWS;
};
