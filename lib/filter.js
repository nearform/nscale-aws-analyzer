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



exports.stripBlankLines = function(str) {
  var i = 0;
  var out = '';
  while (i < str.length) {
    var j = str.indexOf('\n', i);
    if (j === -1) {
      j = str.length;
    }
    var line = str.substr(i, j-i);
    if (line.length > 0) {
      out += str.substr(i, j-i) + '\n';
    }
    i = j+1;
  }
  return out;
};



exports.dropOutside = function(str, start, end) {
  var drop = true;
  var result = '';

  _.each(str.split('\n'), function(line) {
    if (drop && start.test(line)) {
      drop = false;
    }
    if (!drop && end.test(line)) {
      drop = true;
    }
    if (!drop) {
      result += line;
    }
  });
  return result;
};


