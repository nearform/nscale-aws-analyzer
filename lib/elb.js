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



module.exports = function fetchLoadBalancers(AWS, config, result, cb) {
  var elb = new AWS.ELB();

  elb.describeLoadBalancers({}, function(err, data) {
    if (err) { return cb(err); }

    data.LoadBalancerDescriptions.forEach(function(elb) {
      var id;
      var containers;
      var containerDefinitions;

      console.log(JSON.stringify(elb, null, 2));

      id = elb.DNSName;
      containers = result.topology.containers;
      containerDefinitions = result.containerDefinitions;

      _.each(elb.Instances, function(instance) {
        var container = _.find(containers, function(container) { return container.nativeId === instance.InstanceId; });
        if (container) {
          if (!_.find(containerDefinitions, function(cdef) { return cdef.id === id; })) {
            containerDefinitions.unshift({id: id, nativeId: id, type: 'aws-elb', specific: {}});
            containers[id] = {id: id, 
                              name: id,
                              type: 'aws-elb',
                              nativeId: id,
                              containerDefinitionId: id, 
                              contains: [], 
                              specific: createSpecificBlock(elb)};
          }
          containers[id].contains.push(container.id);
        }
      });
    });
    cb();
  });
};

