nfd-aws-analyzer
================

Analyze your AWS deployment!

```bash
npm install nfd-aws-analyzer -g
nfd-aws-analyzer ./config.js
{
  "mcollina": {
    "name": "mcollina status on 2014-06-09T16:48:50.602Z",
    "namespace": "mcollina",
    "id": "eef0a0a0-eff5-11e3-aeca-21cba7b24b1c",
    "containerDefinitions": [
      {
        "id": "ami-fb8e9292",
        "type": "ami",
        "specific": {
          "notManaged": true
        }
      }
    ],
    "topology": {
      "containers": {
        "instance1": {
          "id": "instance1",
          "specific": {
            "imageId": "ami-fb8e9292",
            "instanceId": "i-f2bbc5a1",
            "publicIpAddress": "54.198.3.251",
            "privateIpAddress": "10.185.235.8"
          }
        },
        "instance2": {
          "id": "instance2",
          "specific": {
            "imageId": "ami-fb8e9292",
            "instanceId": "i-cea2dc9d",
            "publicIpAddress": "184.73.96.113",
            "privateIpAddress": "10.155.178.230"
          }
        }
      }
    }
  }
}
```

The `config.js` file is the very same of [aws-sdk](http://npm.im/aws-sdk).

For embedded usage see analyze.js file.

```js
var fs          = require('fs')
  , configFile  = process.argv[2]
  , analyze     = require('./')
  , AWS         = require('aws-sdk')
  , config

if (!configFile) {
  console.log('Missing config')
  process.exit(-1)
}

try {
  AWS.config.loadFromPath(configFile)
} catch(err) {
  console.log(err)
  console.log('unable to read', configFile)
  process.exit(-1)
}

analyze(function(err, status) {
  if (err) {
    console.log(err)
    process.exit(1)
  }

  console.log(JSON.stringify(status, null, 2))
})
```

TODO
----

* [x] Link to the container definition inside the container
* [ ] add unit tests
* [ ] add docker support
* [ ] add ELB support
* [ ] limit the search to only 1 namespace (for speed)
* [ ] generate a new spec when ids are missing
