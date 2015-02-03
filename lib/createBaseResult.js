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

module.exports = function createBaseResult(config, system, callback) {
  if (!config & !system) return callback('system or config required', null);

  system = system || {
    topology: {}
  };

  var result = {
    name: system.name || config.name,
    namespace: system.namespace || config.namespace,
    id: system.systemId || config.systemId,
    containerDefinitions: [],
    topology: {
      name: system.topology.name || null,
      containers: {}
    }
  };

  if (!result.name) return callback('could not determine name', result);
  if (!result.namespace) return callback('could not determine namespace', result);
  if (!result.id) return callback('could not determine id', result);

  callback(null, result);
};