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

var childProcess = require('child_process');
var filter = require('./filter');



exports.tearUp = function(keyPath, ipAddress, cb) {
  childProcess.exec('sh ' + __dirname + '/../scripts/pipe.sh ' + keyPath + ' ' +  ipAddress, function(err/*, stdout, stderr*/) {
    cb(err);
  });
};



exports.tearDown  = function() {
};



var parseOutput = function(stdout/*, stderr*/) {
  var filtered = filter.dropOutside(stdout.toString('utf8'), /^\[\{/, /\]\}/);
  filtered = filtered.replace(/[\r\n]+/gm,'');

  // ugly hack fix in filter!!
  if (filtered[filtered.length - 1] === '0') {
    filtered = filtered.substr(0, filtered.length - 1);
  }
  if (filtered.length === 0) {
    filtered = '[]';
  }
  return JSON.parse(filtered);
};



exports.images = function(keyPath, ipAddress, cb) {
  childProcess.exec('sh ' + __dirname + '/../scripts/getImages.sh ' + keyPath + ' ' +  ipAddress, function(err, stdout, stderr) {
    cb(err, parseOutput(stdout, stderr));
  });
};



exports.containers = function(keyPath, ipAddress, cb) {
  childProcess.exec('sh ' + __dirname + '/../scripts/getContainers.sh ' + keyPath + ' ' +  ipAddress, function(err, stdout, stderr) {
    cb(err, parseOutput(stdout, stderr));
  });
};

