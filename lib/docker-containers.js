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
var _ = require('lodash');
var docker = require('../lib/dockerApi');

/*
 * assumes that the container names take the form
 * searches on container regex and returns the latest based on docker timestamp
 * and latest running
 * 
 * finds the greatest build number 
 * if build number is absent finds the latest by time
 */
/*
 * should be able to infer the arguments from the running container parameters - e.g the port numbers
 */


var queryImages = function(identityFile, ipAddress, cb) {
  docker.tearUp(identityFile, ipAddress, function() {
    console.log('done!!');
  });
  setTimeout(function() {
    docker.images(identityFile, ipAddress, function(err, images) {
      cb(err, images);
    });
  }, 2000);
};



var queryContainers = function(identityFile, ipAddress, cb) {
  docker.tearUp(identityFile, ipAddress, function() {
    console.log('done!!');
  });
  setTimeout(function() {
    docker.containers(identityFile, ipAddress, function(err, containers) {
      cb(err, containers);
    });
  }, 2000);
};



exports.fetchContainers = function fetchContainers(options, result, done) {
  var topologyContainers = result.topology.containers;
//  var containerDefinitions  = result.containerDefinitions;
  var matches = {};
  var newTopology = {};

  _.each(options.dockerFilters, function(filter) {
    matches[filter] = { containerFound: false };
  });

  async.eachSeries(_.values(topologyContainers), function(ec2instance, cb) {
    queryContainers(options.identityFile, ec2instance.specific.privateIpAddress, function(err, containers) {
      _.each(containers, function(container) {
        _.each(options.dockerFilters, function(filter) {
          if (container.Image.indexOf(filter) !== -1) {
            ec2instance.contains.push(container.Id);
            newTopology[container.Id] = {id: container.Id,
                                         containerDefinitionId: '',
                                         containedBy:  ec2instance.id,
                                         contains: [],
                                         specific: {
                                           dockerImageId: container.Id,
                                           containerBinary: '',
                                           dockerLocalTag: '',
                                           buildNumber: 0,
                                           version: ''}};
          }
        });
      });
      cb();
    });
  }, function() {
    _.merge(result.topology.containers, newTopology);
    done()});
};



exports.fetchImages = function fetchImages(options, result, done) {
  var topologyContainers    = result.topology.containers;
  var containerDefinitions  = result.containerDefinitions;
  var matches = {};

  _.each(options.dockerFilters, function(filter) {
    matches[filter] = { imageFound: false, containerFound: false };
  });

  async.eachSeries(_.values(topologyContainers), function(ec2instance, cb) {
    queryImages(options.identityFile, ec2instance.specific.privateIpAddress, function(err, images) {
      _.each(images, function(image) {
        _.each(options.dockerFilters, function(filter) {
          if (image.RepoTags[0].indexOf(filter) !== -1) {
            if (!matches[filter].imageFound) {
              matches[filter].imageFound = true;
              containerDefinitions.push({id: image.Id, 
                                         name: filter, 
                                         type: 'docker', 
                                         specific: {repositoryUrl: '',
                                                    buildScript: '',
                                                    'arguments': '',
                                                    buildHead: 0,
                                                    dockerImageId: image.Id, 
                                                    imageTag: image.RepoTags[0]}});
            }
          }
        });
      });
      cb();
    });
  }, done);
};

