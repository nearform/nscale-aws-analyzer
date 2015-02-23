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

var _ = require('lodash');
var AWS = require('aws-sdk');
var async = require('async');



var createSpecificBlock = function(elb) {
  var listeners = [];
  var specific = {
    LoadBalancerName: elb.LoadBalancerName,
    AvailabilityZones: elb.AvailabilityZones,
    Scheme: elb.Scheme
  };

  _.each(elb.ListenerDescriptions, function(ld) {
    listeners.push(ld.Listener);
  });
  specific.Listeners = listeners;
  return specific;
};



var addInstances = function(balancer, balancerId, containers) {
  _.each(balancer.Instances, function(instance) {
    var container = _.find(containers, function(container) { return container.nativeId === instance.InstanceId; });
    if (container) {
      containers[balancerId].contains.push(container.id);
    }
  });
};



module.exports = function fetchLoadBalancers(config, result, cb) {
  var elb = new AWS.ELB();
  var containers = result.topology.containers;
  var containerDefinitions = result.containerDefinitions;
  var id;

  elb.describeLoadBalancers({}, function(err, data) {
    if (err) { return cb(err); }

    async.eachSeries(data.LoadBalancerDescriptions, function(balancer, next) {
      elb.describeTags({LoadBalancerNames: [balancer.LoadBalancerName]}, function(err, tags) {
        var sysTag = _.find(tags.TagDescriptions[0].Tags, function(tag) { 
          return tag.Key === 'nscale-system' && tag.Value === result.name + '-' + result.topology.name;
        });
        if (sysTag) {
          if (!_.find(containerDefinitions, function(cdef) { return cdef.id === balancer.LoadBalancerName; })) {
            id = balancer.LoadBalancerName;
            containerDefinitions.unshift({id: id,
                                          nativeId: balancer.DNSName,
                                          type: 'aws-elb',
                                          name: balancer.LoadBalancerName,
                                          specific: {}});
            containers[id] = {id: id, 
                              name: balancer.LoadBalancerName,
                              containedBy: id,
                              type: 'aws-elb',
                              nativeId: id,
                              containerDefinitionId: id, 
                              contains: [], 
                              specific: createSpecificBlock(balancer)};
            addInstances(balancer, id, containers);
          }
        }
        next();
      });
    }, function(err) {
      cb(err);
    });
  });
};

