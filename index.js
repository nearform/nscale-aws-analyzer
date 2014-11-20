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
var fetchInstances = require('./lib/ec2-instances');
var fetchImages = require('./lib/ec2-amis');
var fetchSgs = require('./lib/ec2-sgs');
var dockerAnalyzer = require('nscale-docker-ssh-analyzer');
var stripExtraneous = require('./lib/stripExtraneous');
var fetchLoadBalancers = require('./lib/elb');
var postProcessing = require('./lib/postProcessing');
var AWS = require('aws-sdk');



/**
 * run an analysis on an AWS account
 *
 * config (required):
 *  "accessKeyId":        AWS access key (required)
 *  "secretAccessKey":    AWS secret access key (required)
 *  "region":             AWS region (required)
 *  "user":               common user name for login to aws systems (required)
 *  "identityFile":       AWS pem file (required)
 *
 * Optional:
 *  "instanceFilter":     the tag key to filter instances on
 *
 *  system (required): the latest system definition, can be null
 */
exports.analyze = function analyze(config, system, cb) {
  system = system || {};

  var result = {'name': system.name || config.name,
                'namespace': system.namespace || config.namespace,
                'id': system.systemId || config.systemId,
                'containerDefinitions': [],
                'topology': { 'containers': {}}};

  AWS.config.update(config);
  AWS.config.update({region: config.region});

  var match = require('./lib/match')(system);

  async.eachSeries([
    fetchInstances,
    fetchImages,
    fetchSgs,
    dockerAnalyzer(config, system),
    stripExtraneous,
    fetchLoadBalancers,
    postProcessing,
    match
  ], function(func, cb) {
    func(config, result, function(err) {
      if (err) { return cb(err); }
      cb(null);
    });
  }, function(err) { cb(err, result); });
};

