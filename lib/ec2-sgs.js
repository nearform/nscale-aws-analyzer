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
 * analyze the AWS security groups. The following tags must be in place on the group
 * 
 * nscale-system: <namespace>-<target> for example nodezoo-blue
 * nscale-id: <namespace>-<target>-<nscaleID> for example nodezoo-blue-awsSg-12345
 * Name: <nscaleId> for example awsSg-12345
 */
module.exports = function fetchSecurityGroups(config, result, cb) {
  var ec2 = new AWS.EC2();
  var filters = [];
  filters.push({Name: 'tag:nscale-system', Values: [result.name + '-' + result.topology.name]});

  var sgParams = {Filters: filters};
  console.log(JSON.stringify(sgParams, null, 2));

  ec2.describeSecurityGroups(sgParams, function(err, sgroups) {
    _.each(sgroups.SecurityGroups, function(sg) {
      var nameTag = _.find(sg.Tags, function(tag) { return tag.Key === 'Name'; });
      var defName;
      var id;

      if (nameTag) {
        id = nameTag.Value;
        defName = nameTag.Value.split('-')[0];
      }
      else {
        id = sg.GroupId;
        defName = sg.GroupId;
      }
      result.containerDefinitions.push({name: defName, id: defName, type: 'aws-sg', specific: sg});
      result.topology.containers[id] = {id: id,
                                        containedBy: null,
                                        containerDefinitionId: defName,
                                        type: 'aws-sg',
                                        contains: [],
                                        specific: sg,
                                        nativeId: sg.GroupId};
    });
    cb(err);
  });
};


