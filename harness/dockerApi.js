'use strict';

var docker = require('../lib/dockerApi');



docker.tearUp('/home/ubuntu/nfd.pem', '10.75.29.243', function() {
  console.log('done!!');
});
setTimeout(function() {
  docker.containers('/home/ubuntu/nfd.pem', '10.75.29.243', function(err, cont) {
    console.log(JSON.stringify(cont, null, 2));
  });
}, 2000);



/*
docker.tearUp('/home/ubuntu/nfd.pem', '10.74.143.152', function() {
  console.log('done!!');
});
setTimeout(function() {
  docker.images('/home/ubuntu/nfd.pem', '10.74.143.152', function(err, images) {
    console.log(JSON.stringify(images, null, 2));

    docker.tearUp('/home/ubuntu/nfd.pem', '10.74.143.152', function() {
      console.log('done!!');
    });
    setTimeout(function() {
      docker.containers('/home/ubuntu/nfd.pem', '10.74.143.152', function(err, images) {
        console.log(JSON.stringify(images, null, 2));
        process.exit(0);
      });
    }, 2000);
  });
}, 2000);
*/

