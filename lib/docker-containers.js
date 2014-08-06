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
var helpers = require('./docker-helpers');
var nameRegexp = /\/?nfd[-:]([^-]+)-(.+)$/;



function fetchContainers(options, namespaces, done) {
  async.each(_.values(namespaces), function(namespace, cb) {
    var topologyContainers    = namespace.topology.containers;
    var containerDefinitions  = namespace.containerDefinitions;

    async.each(_.values(topologyContainers), function(ec2instance, cb) {
      helpers.tunnelAndFetch({user: options.user,
                              host: ec2instance.specific.privateIpAddress,
                              identityFile: options.identityFile,
                              remotePort: options.dockerRemote}, function(err, containers, images) {
        if (err) { return cb(err); }
        var imageIdToNfdId = {};

        images.forEach(function(image) {
          var id;
          var def;
          var match = image.RepoTags.reduce(function(acc, tag) {
                        if (acc) { return acc; }
                        return tag.match(nameRegexp);
                      }, null);

          if (!match) { return; }

          id = match[2];
          def = {id: id,
                 type: 'docker',
                 specific: {imageId: image.Id}};
          containerDefinitions.push(def);
          imageIdToNfdId[image.Id] = id;
        });

        containers.forEach(function(container) {
          var id;
          var match = container.Names[0].match(nameRegexp);

          if (!match) { return; }

          id = match[2];
          topologyContainers[id] = {id: id, 
                                    containerDefinitions: imageIdToNfdId[container.Image], 
                                    containedBy: ec2instance.id, 
                                    specific: {imageId: container.Image,
                                               containerId: container.Id}};
          ec2instance.contains = ec2instance.contains || [];
          ec2instance.contains.push(id);
        });

        cb();
      });
    }, cb);
  }, function(err) {
    if (err) { return done(err); }
    done();
  });
}

module.exports = fetchContainers;

