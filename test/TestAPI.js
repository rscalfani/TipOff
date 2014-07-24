var http = require('http');
var querystring = require('querystring');
var url = require('url');

var server = http.createServer(function(request, response) {
	var parsedUrl = url.parse(request.url);
	if (parsedUrl.path == '/favicon.ico')
	{
		response.end();
		return
	}
	console.log(querystring.parse(parsedUrl.query));
	response.writeHead(200, {'Content-Type': 'text/plain'});
	response.write('GOT RESPONSE');
	// make callback to app
	response.end();
});

server.listen(8080);
console.log("Server is listening");