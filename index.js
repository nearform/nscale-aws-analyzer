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
var dockerAnalyzer = require('nscale-docker-analyzer');
var dockerApi = require('./lib/dockerApi');
var stripExtraneous = require('./lib/stripExtraneous');
var fetchLoadBalancers = require('./lib/elb');
var postProcessing = require('./lib/postProcessing');
var AWS = require('aws-sdk');



/**
 * run an analysis on an AWS account
 *
 * config:
 *
 * Required:
 *  "accessKeyId":        AWS access key
 *  "secretAccessKey":    AWS secret access key
 *  "region":             AWS region
 *  "user":               common user name for login to aws systems
 *  "identityFile":       AWS pem file
 *  "name":               the system name to use
 *  "namespace":          the system namespace to use
 *  "systemId":           the system id to insert into the generated system definition file
 *
 * Optional:
 *  "instanceFilter":     the tag key to filter instances on (typically nfd-id)
 *
 *  ??"dockerRemote": "8000"
 *
 *  system: the latest system definition
 */
exports.analyze = function analyze(config, system, cb) {
  var result = {'name': config.name || system.name,
                'namespace': config.namespace || system.namespace,
                'id': config.systemId || system.systemId,
                'containerDefinitions': [],
                'topology': { 'containers': {}}};

  AWS.config.update(config);
  AWS.config.update({region: config.region});

  var docker = dockerAnalyzer(dockerApi);

  async.eachSeries([
    fetchInstances,
    fetchImages,
    fetchSgs,
    docker.fetchImages,
    docker.fetchContainers,
    stripExtraneous,
    fetchLoadBalancers,
    postProcessing
  ], function(func, cb) {
    func(config, result, function(err) {
      if (err) { return cb(err); }
      cb(null);
    });
  }, function(err) { cb(err, result); });
};

