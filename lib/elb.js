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

var AWS = require('aws-sdk');
var _ = require('lodash');
var nameRegexp = /\/?nfd[-:]([^-]+)-(.+)$/;
var uuid = require('uuid');

function fetchLoadBalancers(config, namespaces, cb) {
  var elb = new AWS.ELB();
  var instancesMap  = _.chain(namespaces)
                       .values()
                       .map(function(namespace) {
                         return _.values(namespace.topology.containers);
                       })
                       .flatten()
                       .filter(function(container) {
                         // this is an EC2 instance
                         return container.specific.instanceId;
                       })
                       .reduce(function(acc, container) {
                         acc[container.specific.instanceId] = container;
                         return acc;
                       }, {})
                       .value();

  elb.describeLoadBalancers({}, function(err, data) {
    if (err) { return cb(err); }

    data.LoadBalancerDescriptions.forEach(function(elb) {
      var match = elb.LoadBalancerName.match(nameRegexp);
      var id;
      var namespace;
      var topologyContainers;
      var containerDefinitions;
      var def;

      if (!match) { return; }

      id = match[2];
      namespace = match[1];
      if (!namespaces[namespace]) {
        // TODO handle this condition better
        return cb(new Error('ELB with no instance'));
      }

      topologyContainers    = namespaces[namespace].topology.containers;
      containerDefinitions  = namespaces[namespace].containerDefinitions;
      def = {id: uuid.v1(), 
             type: 'aws-elb'};

      containerDefinitions.push(def);
      topologyContainers[id] = {id: id, 
                                containerDefinitionId: def.id, 
                                contains: [], 
                                specific: {}};

      elb.Instances.forEach(function(instance) {
        instance = instancesMap[instance.InstanceId];
        topologyContainers[id].contains.push(instance.id);
        instance.containedBy = id;
      });
    });
    cb();
  });
}

module.exports = fetchLoadBalancers;

