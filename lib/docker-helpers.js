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

var dig = require('ssh-mole');
var async = require('async');
var Docker = require('dockerode');



function fetch(port, cb) {
  var docker = new Docker({host: 'http://localhost', port: port});

  async.series([
    docker.listContainers.bind(docker),
    docker.listImages.bind(docker)
  ], function(err, results) {
    if (err) { return cb(err); }
    cb(null, results[0], results[1]);
  });
}



function tunnelAndFetch(params, cb) {
  params.remotePort = params.remotePort || 3000;
  dig(params, function(err, control) {
    if (err) { return cb(err); }
    fetch(control.port, function(err, containers, images) {
      control.done();
      if (err) { return cb(err); }
      cb(null, containers, images);
    });
  });
}



module.exports.tunnelAndFetch = tunnelAndFetch;

