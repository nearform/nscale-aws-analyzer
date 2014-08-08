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



module.exports = function fetchLoadBalancers(config, result, cb) {
  var elb = new AWS.ELB();

  elb.describeLoadBalancers({}, function(err, data) {
    if (err) { return cb(err); }

    data.LoadBalancerDescriptions.forEach(function(elb) {
      var id;
      var containers;
      var containerDefinitions;
      var def;

      id = elb.DNSName;
      containers = result.topology.containers;
      containerDefinitions = result.containerDefinitions;
      def = {id: id, type: 'aws-elb'};

      _.each(elb.Instances, function(instance) {
        var container = _.find(containers, function(container) { return container.nativeId === instance.InstanceId; });
        if (container) {
          if (!_.find(containerDefinitions, function(cdef) { return cdef.id === id; })) {
            containerDefinitions.unshift({id: id, nativeId: id, type: 'aws-elb', specific: {}});
            containers[id] = {id: id, 
                              nativeId: id,
                              containerDefinitionId: id, 
                              contains: [], 
                              specific: {}};
          }
          containers[id].contains.push(container.id);
        }
      });
    });
    cb();
  });
};

