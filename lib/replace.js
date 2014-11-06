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
var traverse = require('traverse');



var replaceIdValues = function(oldId, newId, system) {
  var result = traverse(system).forEach(function(x) {
    if (x === oldId) {
      if (this.key !== 'nativeId') {
        this.update(newId);
      }
    }
  });
  return result;
};



var replaceIdKeys = function(oldId, newId, system) {
  var _paths = [];

  traverse(system).forEach(function() {
    if (this.key === oldId) {
      _paths.push(this.path);
    }
  });

  _.each(_paths, function(path) {
    var newPath = _.clone(path);
    newPath.pop();
    newPath.push(newId);
    traverse(system).set(newPath, traverse(system).get(path));
  });

  var result = traverse(system).forEach(function() {
    if (this.key === oldId) {
      this.delete();
    }
  });
  return result;
};



exports.replaceId = function(oldId, newId, system) {
  var updated = replaceIdValues(oldId, newId, system);
  updated = replaceIdKeys(oldId, newId, updated);
  return updated;
};

