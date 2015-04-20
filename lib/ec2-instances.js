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
 * analyze the AWS instances. The following tags must be in place on the machine instances
 *
 * nscale-system: <namespace>-<target> for example nodezoo-blue
 * nscale-id: <namespace>-<target>-<nscaleID> for example nodezoo-blue-awsMachine$fe-12345
 * Name: <nscaleId> for example awsMachine$fe-12345
 */
module.exports = function fetchInstances(config, result, cb) {
  var ec2 = new AWS.EC2(config);
  var filters = [{Name: 'instance-state-code', Values: ['16']}];

  filters.push({ Name: 'tag:nscale-system', Values: [result.name + '-' + result.topology.name] });

  var params = {Filters: filters};
  ec2.describeInstances(params, function(err, data) {
    if (err) { return cb(err); }
    data.Reservations.forEach(function(reservation) {
      reservation.Instances.forEach(function(instance) {

        var nameTag = _.find(instance.Tags, function(tag) { return tag.Key === 'Name'; });
        var id = instance.InstanceId;

        var nativeId = instance.InstanceId;
        var containers;

        containers = result.topology.containers;
        containers[id] = {id: id,
                          name: nativeId,
                          nativeId: nativeId,
                          contains: [],
                          type: 'aws-ami',
                          specific: {imageId: instance.ImageId,
                                     instanceId: instance.InstanceId,
                                     publicIpAddress: instance.PublicIpAddress,
                                     privateIpAddress: instance.PrivateIpAddress,
                                     securityGroups: instance.SecurityGroups,
                                     tags: instance.Tags}};
      });
    });
    cb();
  });
};
