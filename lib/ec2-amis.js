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


module.exports = function fetchImages(config, result, cb) {
  var ec2 = new AWS.EC2();
  var imagesMap = {};
  var instancesMap = {};
  var imageIds = _.chain([result])
                  .values()
                  .map(function(res) {
                    return _.values(res.topology.containers);
                  })
                  .flatten()
                  .map(function(instance) {
                    return instance.specific.imageId;
                  })
                  .uniq()
                  .value();
  var params  = { ImageIds: imageIds };


  _.chain([result])
   .values()
   .forEach(function(res) {
     _.chain(res.topology.containers)
      .forEach(function(container) {
        var imageId = container.specific.imageId;
          if (!imagesMap[imageId]) {
            imagesMap[imageId] = [];
          }
          imagesMap[imageId].push(res);
          imagesMap[imageId] = _.uniq(imagesMap[imageId]);
       })
      .forEach(function(container) {
        var imageId = container.specific.imageId;
        if (!instancesMap[imageId]) {
          instancesMap[imageId] = [];
        }
         instancesMap[imageId].push(container);
      });
   });

  if (params.ImageIds.length > 0) {
    ec2.describeImages(params, function(err, data) {
      if (err) { return cb(err); }

      data.Images.forEach(function(image) {
        // if an AMI is a stock one and not managed by nfd lets use the AWS ImageId
        var id = image.ImageId;
        var nativeId = image.ImageId;

      /*
      image.Tags.forEach(function(tag) {
        if (tag.Key === 'nfd-id') {
          id = tag.Value;
        }
      });
      */
        imagesMap[image.ImageId].forEach(function(doc) {
          var def = {id: id, 
                     name: nativeId,
                     nativeId: nativeId,
                     type: 'aws-ami', 
                     specific: {}};
          doc.containerDefinitions.push(def);
        });

        instancesMap[image.ImageId].forEach(function(instance) {
          instance.containerDefinitionId = id;
        });
      });
      cb();
    });
  }
  else {
    cb();
  }
};

