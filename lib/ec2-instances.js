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



module.exports = function fetchInstances(AWS, config, result, cb) {
  var ec2 = new AWS.EC2();
  var filters = [{Name: 'instance-state-code', Values: ['16']}];
  if (config.instanceFilter) {
    filters.push({Name: 'tag-key', Values: [config.instanceFilter]});
  }

  var params = {Filters: filters};
  ec2.describeInstances(params, function(err, data) {
    if (err) { return cb(err); }
    data.Reservations.forEach(function(reservation) {
      reservation.Instances.forEach(function(instance) {
        var id = instance.InstanceId;
        var nativeId = instance.InstanceId;
        var containers;

        instance.Tags.forEach(function(tag) {
          if (tag.Key === 'nfd-id') {
            id = tag.Value;
          }
        });

        containers = result.topology.containers;
        containers[id] = {id: id, 
                          nativeId: nativeId,
                          contains: [],
                          type: 'aws-instance',
                          specific: {imageId: instance.ImageId, 
                                     instanceId: instance.InstanceId, 
                                     publicIpAddress: instance.PublicIpAddress, 
                                     privateIpAddress: instance.PrivateIpAddress}};
      });
    });
    cb();
  });
};

