var _ = require('underscore');
var EventEmitter = require('events').EventEmitter;
var http = require('http');
var https = require ('https');
var querystring = require('querystring');
var url = require('url');

var countersDef = {
	responseErrors: {displayName: 'Response Errors'},
	requestErrors: {displayName: 'Request Errors'},
	timeouts: {displayName: 'Timeouts'},
	badPatternErrors: {displayName: 'Bad Pattern Errors'},
	badResponse: {displayName: 'Bad Response'},
	successfulResponse: {displayName: 'Successful Response'},
	successfulRequest: {displayName: 'Successful Request'}
};

module.exports = function(loggers, stats, config) {
	var updateStats = stats.registerCounters('monitor', countersDef);
	var private = {
		startIds: [],
		websites: [],
		graceList: {}, // name: gracePeriodEnd (in ms)
		foundBadPattern: function(patterns, data) {
			if (!patterns)
				return null;
			var matchingString = null;
			patterns.some(function(pattern) {
				var result = data.match(pattern);
				if (result != null) {
					matchingString = result[0];
					return true;
				}
			});
			return matchingString;
		},
		configValidation: function(websites) {
			websites.forEach(function(website) {
				if (website.sampleRate < website.maxResponseTime)
					throw new Error('sampleRate of ' + website.hostname + ' must be equal to or greater than its maxResponseTime');
			});
		},
		monitor: function(website) {
			var requestAborted = false;
			var waitingToMonitor = false;
			var waitingTimeoutId;
			var abortRequest = function() {
				req.abort();
				requestAborted = true;
				clearTimeout(requestTimeoutId);
			};
			website.stop = function() {
				// waiting to monitor again
				if (waitingToMonitor == true)
					clearTimeout(waitingTimeoutId);
				// in the middle of a request
				else
					abortRequest();
			};
			var monitorAgain = function() {
				waitingToMonitor = true;
				waitingTimeoutId = setTimeout(function() {
					private.monitor(website);
				}, website.sampleRate * 1000);
			};
			if(website.name in private.graceList)
			{
				if (Date.now() < private.graceList[website.name])
				{
					monitorAgain();
					return;
				}
				else
					monitor.stopGrace(website.name);
			}
			// create request
			var responseData = '';
			var protocol = (website.protocol == 'http:' ? http : https);
			var method = website.post ? 'POST' : 'GET';
			var options = {
				host: website.hostname,
				port: website.port,
				path: website.path,
				method: method
			};
			var postData = querystring.stringify(website.post);
			_.extend(options, website.httpOptions);
			if (method == 'POST')
			{
				_.defaults(options, {headers: {}});
				_.extend(options.headers, {
					'Content-Type': 'application/x-www-form-urlencoded',
					'Content-Length': postData.length
				});
			}
			var req = protocol.request(options, function(res) {
				// create response error handler
				res.on('error', function(err) {
					loggers.op.warn('Response Error: ' + err.message);
					updateStats.increment('responseErrors');
					monitor.emitter.emit('problem', website.name, website.url, 'Response Error');
					clearTimeout(requestTimeoutId);
					monitorAgain();
				});
				// receive partial data
				res.on('data', function(chunk) {
					responseData += chunk;
					clearTimeout(requestTimeoutId);
				});
				// received all data
				res.on('end', function() {
					clearTimeout(requestTimeoutId);
					loggers.op.trace('Successful Response');
					updateStats.increment('successfulResponse');
					if (res.statusCode == 200)
					{
						// check patterns
						var matchingString = private.foundBadPattern(website.patterns, responseData);
						if (matchingString != null)
						{
							loggers.op.warn(website.url + ' (Found Bad Patterns: ' + matchingString + ')');
							updateStats.increment('badPatternErrors');
							monitor.emitter.emit('problem', website.name, website.url, 'Found Bad Patterns');
						}
						else
							monitor.emitter.emit('no problems', website.name, website.url);
					}
					else if ([301, 302, 307, 308].indexOf(res.statusCode) != -1 )
					{
						loggers.op.info('Redirecting from ' + website.url + ' to ' + res.headers.location);
						var urlParts = url.parse(res.headers.location);
						website.protocol = urlParts.protocol;
						website.hostname = urlParts.hostname;
						website.port = urlParts.port;
						website.path = urlParts.path;
					}
					else
					{
						loggers.op.warn(website.url + ' (Bad Response: ' + res.statusCode + ')');
						updateStats.increment('badResponse');
						monitor.emitter.emit('problem', website.name, website.url, 'Bad Response');
					}
					monitorAgain();
				});
			});
			// create request error handler
			req.on('error', function(err) {
				// sometimes req.abort() causes an error
				// in that case, do nothing
				if (requestAborted)
					return;
				loggers.op.warn('Request Error: ' + err.message);
				updateStats.increment('requestErrors');
				monitor.emitter.emit('problem', website.name, website.url, 'Request Error');
				clearTimeout(requestTimeoutId);
				monitorAgain();
			});
			if (method == 'POST')
				req.write(postData);
			// send request
			req.end();
			loggers.op.trace('Successful Request');
			updateStats.increment('successfulRequest');
			// start maxResponse timeout
			var requestTimeoutId = setTimeout(function() {
				abortRequest();
				loggers.op.warn(website.url + ' Timeout');
				updateStats.increment('timeouts');
				monitor.emitter.emit('problem', website.name, website.url, 'Timeout');
				monitorAgain();
			}, website.maxResponseTime * 1000);
		}
	};
	var monitor = {
		emitter: new EventEmitter,
		init: function() {
			config.websites.forEach(function(websiteConfig) {
				var website = _.defaults({}, websiteConfig, config.defaults);
				var urlParts = url.parse(website.url);
				private.websites.push({
					name: website.name,
					url: website.url,
					protocol: urlParts.protocol,
					hostname: urlParts.hostname,
					port: urlParts.port,
					path: urlParts.path,
					sampleRate: website.sampleRate,
					maxResponseTime: website.maxResponseTime,
					patterns: website.patterns,
					post: website.post,
					httpOptions: website.httpOptions
				});
				private.configValidation(private.websites);
			});
		},
		start: function() {
			loggers.op.warn('Starting Monitor');
			var randomNumber = function(min, max) {
				return Math.random() * (max - min) + min;
			};
			private.websites.forEach(function(website) {
				var startId = setTimeout(function() {
					private.monitor(website);
				}, randomNumber(0, website.sampleRate) * 1000);
				private.startIds.push(startId);
			});
		},
		stop: function() {
			loggers.op.warn('Stopping Monitor');
			private.startIds.forEach(function(startId) {
				clearTimeout(startId);
			});
			private.websites.forEach(function(website) {
				if(website.stop)
					website.stop();
				// removing stop function to free up its closure
				delete website.stop;
			});
		},
		// functions called in api
		startGrace: function(name, mins) {
			private.graceList[name] = Date.now() + (mins * 60 * 1000);
			loggers.op.info('Starting Grace Period for ' + name + ' for ' + mins + ' minute' + (mins != 1 ? 's' : ''));
		},
		stopGrace: function(name) {
			delete private.graceList[name];
			loggers.op.info('Stopping Grace Period for ' + name);
		}
	};
	return monitor;
};