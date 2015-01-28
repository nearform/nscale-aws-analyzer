nscale-aws-analyzer
================
Analyze your AWS deployment done by
[nscale](http://github.com/nearform/nscale).

##Installation
The nscale-aws-analyzer module can be installed in a variety of ways depending on usage.

###Directly within nscale
If you are deploying nscale to aws, a simple change to nscale's config file is all that is needed. In
the `modules` section under `analysis`, set the value of `require` to  ___nscale-aws-analyzer___; nscale will
will handle requiring the module.

```bash
{
  ...
  
  "modules": {
    "protocol": {
      "require": "nscale-protocol"
    },
    
    ...
    
    "analysis": {
      "require": "nscale-aws-analyzer"
    }
  }
  
  ...
}
```

###As a global module
To use as a stand alone node module simply install globally from NPM. The module can then be used by
pointing it to a valid config file. Note, npm may require administrator permission to install global
modules.

```bash
[sudo] npm install nscale-aws-analyzer -g
```

```bash
nscale-aws-analyzer ./path/to/config.json
```

###Embeded in your own project
As well as globally, nscale-aws-analyzer can also be installed locally in a project via NPM. Simply
require `nscale-aws-analyzer`. And call `analyze` to get the results in JSON format.

```bash
[sudo] npm install nscale-aws-analyzer --save
```

```javascript
'use strict';

var fs = require('fs');
var analyzer = require('nscale-aws-analyzer');

var configFile = process.argv[2];
var config = JSON.parse(fs.readFileSync(configFile, 'utf8'));

analyzer.analyze(config, null, function(err, result) {
  if (err) {
    process.exit(1);
  }
  
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
  });
```
  
## Configuration
Regardless of installation method, a particular set of fields are required to be present in the config
file. A sample config can be found in the test directory, it is the same as listed below.
  
```javascript
{
  "systemId": "4624e815-f814-4802-89b4-e33340a6af46",
  "namespace": "nsd",
  "name": "nsd-test",
  "accessKeyId": "aws-key-id",
  "secretAccessKey": "aws-access-key",
  "region": "aws-region",
  "user": "awsuser",
  "identityFile": "path/to/pem/file",
  "instanceFilter": "filter"
}
```
  
## License
  
Copyright (c) 2014 Nearform and other contributors
  
Licensed under the Artistic License 2.0
