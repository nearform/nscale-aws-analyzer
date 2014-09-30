nscale-aws-analyzer
================

Analyze your AWS deployment done by
[nscale](http://github.com/nearform/nscale).


```bash
npm install nscale-aws-analyzer -g
nscale-aws-analyzer ./config.js
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

## License

Copyright (c) 2014 Nearform and other contributors

Licensed under the Artistic License 2.0
