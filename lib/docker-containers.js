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
  });
  setTimeout(function() {
    docker.images(identityFile, ipAddress, function(err, images) {
      cb(err, images);
    });
  }, 2000);
};



var queryContainers = function(identityFile, ipAddress, cb) {
  docker.tearUp(identityFile, ipAddress, function() {
  });
  setTimeout(function() {
    docker.containers(identityFile, ipAddress, function(err, containers) {
      cb(err, containers);
    });
  }, 2000);
};



var matchImageToContainer = function(container, results) {
  return _.find(results.containerDefinitions, function(cdef) {
    return cdef.type === 'docker' && cdef.specific.imageTag === container.Image;
  });
};



exports.fetchContainers = function fetchContainers(AWS, options, result, done) {
  var topologyContainers = result.topology.containers;
  var newTopology = {};

  async.eachSeries(_.values(topologyContainers), function(ec2instance, cb) {
    queryContainers(options.identityFile, ec2instance.specific.privateIpAddress, function(err, containers) {
      _.each(containers, function(container) {

        if (options.dockerFilters) {
          _.each(options.dockerFilters, function(filter) {
            if (container.Image.indexOf(filter) !== -1) {
              var cdef = matchImageToContainer(container, result) || {id: ''};
              if (cdef) {
                console.log(JSON.stringify(cdef, null, 2));
                ec2instance.contains.push(container.Id);
                newTopology[container.Id] = {id: container.Id,
                                             type: 'docker', 
                                             containerDefinitionId: cdef.id,
                                             containedBy:  ec2instance.id,
                                             contains: [],
                                             specific: {dockerImageId: cdef.specific.dockerImageId,
                                                        dockerContainerId: container.Id,
                                                        containerBinary: '',
                                                        dockerLocalTag: '',
                                                        buildNumber: 0,
                                                        version: ''}};
              }
            }
          });
        }
        else {
          var cdef = matchImageToContainer(container, result) || {id: ''};
          if (cdef) {
            ec2instance.contains.push(container.Id);
            newTopology[container.Id] = {id: container.Id,
                                         type: 'docker', 
                                         containerDefinitionId: cdef.id,
                                         containedBy:  ec2instance.id,
                                         contains: [],
                                         specific: {dockerImageId: cdef.specific.dockerImageId,
                                                    dockerContainerId: container.Id,
                                                    containerBinary: '',
                                                    dockerLocalTag: '',
                                                    buildNumber: 0,
                                                    version: ''}};
          }
        }
      });
      cb();
    });
  }, function() {
    _.merge(result.topology.containers, newTopology);
    done();
  });
};



/**
 * check this - important not to duplicate images in the container definitions section...
 */
exports.fetchImages = function fetchImages(AWS, options, result, done) {
  var topologyContainers    = result.topology.containers;
  var containerDefinitions  = result.containerDefinitions;

  async.eachSeries(_.values(topologyContainers), function(ec2instance, cb) {
    queryImages(options.identityFile, ec2instance.specific.privateIpAddress, function(err, images) {
      _.each(images, function(image) {

        if (options.dockerFilters) {
          _.each(options.dockerFilters, function(filter) {
            if (image.RepoTags[0].indexOf(filter) !== -1) {
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
          });
        }
        else {
          containerDefinitions.push({id: image.Id, 
                                     name: image.RepoTags[0],
                                     type: 'docker', 
                                     specific: {repositoryUrl: '',
                                                buildScript: '',
                                                'arguments': '',
                                                buildHead: 0,
                                                dockerImageId: image.Id, 
                                                imageTag: image.RepoTags[0]}});
        }
      });
      cb();
    });
  }, done);
};



exports.stripExtraneous = function stripExtraneous(AWS, options, result, done) {
  var res = JSON.parse(JSON.stringify(result));
  result.containerDefinitions = [];

  _.each(res.containerDefinitions, function(cdef) {
    if (_.find(res.topology.containers, function(container) { return container.containerDefinitionId === cdef.id; })) {
      result.containerDefinitions.push(cdef);
    }
    if (cdef.type === 'aws-sg') {
      result.containerDefinitions.push(cdef);
    }
  });
  done();
};


