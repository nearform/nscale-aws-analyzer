var http = require('http')
  , port = process.argv[2] || 1337
http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World\n');
}).listen(port);
console.log('Server running at port', port);
