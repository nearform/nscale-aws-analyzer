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

module.exports = function fetchSecurityGroups(config, result, cb) {
  var ec2 = new AWS.EC2();
  var groupIds = [];

  _.each(result.topology.containers, function(con) {
    if (con.type === 'aws-instance') {
      _.each(con.specific.securityGroups, function(sg) {
        if (!_.find(groupIds, function(gid) { return gid === sg.GroupId; })) {
          groupIds.push(sg.GroupId);
        }
      });
    }
  });

  var sgParams = { GroupIds: groupIds };
  ec2.describeSecurityGroups(sgParams, function(err, sgroups) {
    _.each(sgroups.SecurityGroups, function(sg) {
      result.containerDefinitions.push({name: sg.GroupName, id: sg.GroupId, type: 'aws-sg', specific: sg});
    });
    cb(err);
  });
};


