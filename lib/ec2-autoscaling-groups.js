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

/**
 * analyze the AWS AutoScalingGroups. The following tags must be in place on the Group
 *
 * nscale-system: <namespace>-<target> for example nodezoo-blue
 * Name: <nscaleId> for example awsMachine$fe-12345
 */
module.exports = function fetchAutoScalingGroups(config, result, cb) {
  var autoScaling = new AWS.AutoScaling(config);
  var filters = [
    { Name: 'key', Values: ['nscale-system']},
    { Name: 'value', Values: [result.name + '-' + result.topology.name] }
  ];

  var params = {Filters: filters};
  var containers = result.topology.containers;

  autoScaling.describeTags(params, function(err, data) {
    if (err) {
      return cb(err);
    }

    var names = _.chain(data.Tags)
                 .filter({ResourceType: 'auto-scaling-group'})
                 .pluck('ResourceId')
                 .value()

    if (names.length === 0) {
      // there is no autoscaling group
      return cb();
    }

    var params = {
      AutoScalingGroupNames: names
    };

    autoScaling.describeAutoScalingGroups(params, function(err, data) {
      if (err) {
        return cb(err);
      }

      data.AutoScalingGroups.forEach(function (autoScalingGroup) {
        var nameTag = _.find(autoScalingGroup.Tags, function(tag) {return tag.Key === 'Name'; });
        var id = nameTag.Value;
        var defName = nameTag.Value.split('-')[0];
        var instances = _.chain(autoScalingGroup.Instances).pluck('InstanceId').map(function(instance) {
          var found = _.find(result.topology.containers, function(cont) {
            return cont.nativeId === instance;
          });

          return found;
        }).without(undefined).value();

        var group = _.chain(instances).map(function(instance) {
          return instance.specific.securityGroups;
        }).flatten().pluck('GroupName').find(function(group) {
          return result.topology.containers[group];
        }).value();

        var elb = _.find(autoScalingGroup.LoadBalancerNames, function(elb) {
          return result.topology.containers[elb];
        });

        // the parent is either the ELB or the Security Group.
        var containedBy = elb || group;

        if (!result.topology.containers[containedBy]) {
          return cb(new Error('parent ' + containedBy + ' missing'));
        }

        // at this point we have already looked up both the security groups
        // and the elbs, so it is safe to assume the parent is there
        result.topology.containers[containedBy].contains.push(id);

        result.containerDefinitions.push({
          name: defName,
          id: id,
          type: 'aws-autoscaling',
          specific: autoScalingGroup
        });

        containers[id] = {
          id: id,
          containedBy: containedBy,
          containerDefinitionId: defName,
          type: 'aws-autoscaling',
          contains: _.pluck(instances, 'id'),
          specific: autoScalingGroup,
          nativeId: autoScalingGroup.AutoScalingGroupName
        };

        instances.forEach(function (container) {
          container.type = 'blank-container';
          container.containedBy = id;
        });
      });

      cb();
    });
  });
};
