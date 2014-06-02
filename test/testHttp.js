var https = require('https');

var options = {
	host: 'www.youtube.com',
	port: 443,
	path: '/watch?v=d_4FY3KzzUU',
	method: 'GET'
};

var responseData = '';
var req = https.request(options, function(res) {
	res.on('data', function(chunk) {
		responseData += chunk;
	});
	res.on('end', function() {
		console.log ("Got response: " + res.statusCode + "\n" + responseData);
	});
	res.on('error', function(err) {
		console.log("Response Error: " + err.message);
	});
});
req.on('error', function(err) {
	console.log("Request Error: " + err.message);
});
req.end();
