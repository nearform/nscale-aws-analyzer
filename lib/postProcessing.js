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
module.exports = function postProcessing (system) {

  function handleAutoScalingGroups (result) {
    var containers = result.topology.containers;
    var isAutoscaling = function(container) { return container.type === 'aws-autoscaling'; };
    var autoScalingGroups = _.filter(containers,  isAutoscaling);

    _.forEach(autoScalingGroups, function (cont) {
      var newContains = [];
      var sysContainers = system.topology.containers;
      var sysAwsAutoScalings = _.filter(sysContainers, isAutoscaling);

      _.forEach(sysAwsAutoScalings, function (sysAwsAutoScaling) {
        var sysAwsAutoScalingParent = sysContainers[sysAwsAutoScaling.containedBy];

        // if there is a security group container in the system we should
        // add it also in the analyzer result
        // ie: system contains   elb -> sg -> autoscaling
        //     analyzer returns  elb -> autoscaling
        //
        if (sysAwsAutoScalingParent.type === 'aws-sg') {
          var awsAutoScaling = containers[sysAwsAutoScaling.id];
          if (awsAutoScaling) {
            var awsAutoScalingParent = containers[awsAutoScaling.containedBy];

            var awsSg = containers[sysAwsAutoScalingParent.id];

            // Remove AutoScaling child
            _.remove(awsAutoScalingParent.contains, function (ele) {
              return ele === awsAutoScaling.id;
            });

            awsAutoScalingParent.contains.push(sysAwsAutoScalingParent.id);
            awsAutoScaling.containedBy = sysAwsAutoScalingParent.id;
            awsSg.containedBy = awsAutoScalingParent.id;
            awsSg.contains = _(awsSg.contains).push(awsAutoScaling.id).uniq().value();
          }
        }
      });

      // The autoscaling is supposed to have a single AMachine child
      var sysAwsAutoScalingChild = sysAwsAutoScalings[0].contains[0];
      _.forEach(cont.contains, function (instanceId) {

        var container = containers[instanceId];
        container.id = container.id.replace('i-', sysAwsAutoScalingChild + '-');
        delete containers[instanceId];

        containers[container.id] = container;

        generateChildrenInOriginalSystem(container.nativeId.replace('i-', ''));

        // TODO remove as not needed anymore
        var containedBys = _.filter(containers, function (container) { return container.containedBy === instanceId;});
          _.forEach(containedBys, function (cont) {
          cont.containedBy = container.id;
        });

        newContains.push(container.id);
      });

      cont.contains = newContains;

      _.forEach(system.topology.containers[sysAwsAutoScalingChild].contains, function(child) {
        delete system.topology.containers[child];
      });

      delete system.topology.containers[sysAwsAutoScalingChild];

      function generateChildrenInOriginalSystem(parentId) {
        var group = system.topology.containers[system.topology.containers[sysAwsAutoScalingChild].containedBy];
        var parent = _.cloneDeep(system.topology.containers[sysAwsAutoScalingChild]);
        parent.id = parent.id + '-' + parentId;
        var newContains = _.chain(system.topology.containers[sysAwsAutoScalingChild].contains).map(function(cont) {
          cont = system.topology.containers[cont];
          // creates custom ids based on the blueprint
          var newCont = _.cloneDeep(cont);
          var splitted = newCont.id.split('$');
          newCont.id = splitted[0] + '-' + parentId + '$' + splitted[1];
          newCont.containedBy = parent.id;
          return newCont;
        }).forEach(function(cont) {
          // adds the container to the original system
          system.topology.containers[cont.id] = cont;
        }).map(function(cont) {
          return cont.id;
        }).value();

        group.contains = _.without(group.contains, sysAwsAutoScalingChild);
        group.contains.push(parent.id);

        parent.contains = newContains;

        system.topology.containers[parent.id] = parent;
      }
    });
  }


  return function postProcessing(config, result, cb) {
    var containers = result.topology.containers;
    var elbs = _.filter(containers, function(container) { return container.type === 'aws-elb'; });
    var machines = _.filter(containers, function(container) { return container.type === 'aws-ami'; });
    var newContains;

    _.each(machines, function(machine) {
      if (machine.specific && machine.specific.securityGroups && machine.specific.securityGroups.length > 0) {
        var sg = _.find(containers, function(c) { return c.nativeId === machine.specific.securityGroups[0].GroupId; });
        if (sg) {
          machine.containedBy = sg.id;
          containers[sg.id].contains.push(machine.id);
        }
        else {
          machine.containedBy = machine.specific.securityGroups[0].GroupId;
          containers[machine.specific.securityGroups[0].GroupId].contains.push(machine.id);
        }
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

    handleAutoScalingGroups(result);

    cb();
  };
};

