var http = require('http');
var https = require('https');
var querystring = require('querystring');
var url = require('url');

module.exports = function(loggers, config) {
	var private = {
		apiInterface: null,
		server: null,
		stopping: false,
		listening: false,
		stop: function() {
			loggers.op.warn('Stopping API');
			private.server.close();
		}
	};
	var api = {
		init: function(apiInterface) {
			private.apiInterface = apiInterface;
		},
		start: function() {
			loggers.op.warn('Starting API');
			var createServer = function(options, handler) {
				if (!options || Object.keys(options).length == 0)
					return http.createServer(handler);
				else
					return https.createServer(options, handler);
			};
			private.server = createServer(config.options, function(request, response) {
				var parsedUrl = url.parse(request.url);
				if (parsedUrl.path == '/favicon.ico')
				{
					response.end();
					return
				}
				var query = querystring.parse(parsedUrl.query);
				if (parsedUrl.pathname == '/startGrace')
				{
					private.apiInterface.startGrace(query.website, query.period);
					response.writeHead(200, {'Content-Type': 'text/plain'});
					response.write('Starting Grace Period for ' + query.website + ' for ' + query.period + ' minute' + (query.period != 1 ? 's' : ''));
				}
				else if (parsedUrl.pathname == '/stopGrace')
				{
					private.apiInterface.stopGrace(query.website);
					response.writeHead(200, {'Content-Type': 'text/plain'});
					response.write('Stopping Grace Period for ' + query.website);
				}
				else
				{
					response.writeHead(404, {"Content-Type": "text/plain"});
					response.write("404 Not Found\n");
				}
				response.end();
			});
			private.server.listen(config.port, function() {
				if (private.stopping)
					private.stop();
				else
					private.listening = true;
			});
			loggers.op.info("API Server is Listening on port " + private.server.address().port);
		},
		stop: function() {
			if (private.listening)
				private.stop();
			else
				private.stopping = true;
		}
	};
	return api;
};