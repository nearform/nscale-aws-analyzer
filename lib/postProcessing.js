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


/*
 * post process to hook through SGs not direct to images if sgs exist
 * currenly assumes just 1 or 0 security groups
 */

module.exports = function postProcessing(config, result, cb) {
  var containers = result.topology.containers;
  var elbs = _.filter(containers, function(container) { return container.type === 'aws-elb'; });
  var machines = _.filter(containers, function(container) { return container.type === 'aws-ami'; });
  var newContains;

  _.each(machines, function(machine) {
    if (machine.specific && machine.specific.securityGroups && machine.specific.securityGroups.length > 0) {
      //sgs.push(machine.specific.securityGroups[0].GroupId);
      machine.containedBy = machine.specific.securityGroups[0].GroupId;
      containers[machine.specific.securityGroups[0].GroupId].contains.push(machine.id);
    }
  });

  _.forEach(elbs, function(elb) {
    newContains = [];
    _.forEach(elb.contains, function(instanceId) {
      if (containers[instanceId]) {
        if (containers[instanceId].containedBy) {
          newContains.push(containers[instanceId].containedBy);
          containers[containers[instanceId].containedBy].containedBy = elb.id;
        }
        else {
          newContains.push(instanceId);
          containers[instanceId].containedBy = elb.id;
        }
      }
    });
    elb.contains = _.uniq(newContains);
  });

  _.forEach(containers, function(cont) {
    if (!cont.containedBy) {
      cont.containedBy = cont.id;
    }
  });

  cb();
};

