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

var an = require('../index');
var assert = require('assert');

describe('canAnalyze', function() {
  it('should return false if it contains no aws-* modules', function(){
    var sys = {
      containerDefinitions: [{
        type: 'blank-container'
      }, {
        type: 'docker'
      }]
    };
    assert(!an.canAnalyze(sys));
  });

  it('should return false if it contains an azure module', function(){
    var sys = {
      containerDefinitions: [{
        type: 'azure-image'
      }, {
        type: 'docker'
      }]
    };
    assert(!an.canAnalyze(sys));
  });

  it('should return true if it contains an aws-ami def and a docker def', function(){
    var sys = {
      containerDefinitions: [{
        type: 'aws-ami'
      }, {
        type: 'docker'
      }]
    };
    assert(an.canAnalyze(sys));
  });
});
