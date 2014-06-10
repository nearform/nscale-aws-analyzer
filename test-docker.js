
var sshTunnel = require('./lib/ssh-tunnel')
  , Docker = require('dockerode')

function fetchInstances(port, cb) {
  var docker = new Docker({host: 'http://localhost', port: port});
  docker.listContainers(function (err, containers) {
    if (err) { return fetchInstances(cb) }
    cb(null, containers)
  });
}

sshTunnel({
    host: '54.87.155.178'
  , user: 'ubuntu'
  , remotePort: 3000
  , identityFile: '/Users/matteo/Dropbox/nearForm/mcollina.pem'
}, function(err, control) {
  if (err) {
    console.log(err)
    process.exit(1)
  }

  fetchInstances(control.port, function(err, containers) {
    control.done()

    containers.forEach(function (containerInfo) {
      console.log(containerInfo)
    });

    process.exit(0)
  })
})
