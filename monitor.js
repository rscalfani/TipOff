var _ = require('underscore');
var http = require('http');
var https = require ('https');
var querystring= require('querystring');
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

module.exports = function(loggers, stats) {
	var updateStats = stats.registerCounters('monitor', countersDef);
	var private = {
		foundBadPattern: function (patterns, data) {
			var matchingString = null;
			patterns.some(function (pattern) {
				var result = data.match(pattern);
				if (result != null) {
					matchingString = result[0];
					return true;
				}
			});
			return matchingString;
		},
		configValidation: function (websites) {
			websites.forEach(function (website) {
				if (website.maxResponseTime < website.sampleRate)
					throw new Error('maxResponseTime of ' + website.hostname + ' must be equal to or greater than its sampleRate');
			});
		},
		websites: [],
		configHeaders: {},
		monitor: function (website) {
			var requestAborted = false;
			var waitingToMonitor = false;
			var waitingTimeoutId;
			var abortRequest = function () {
				req.abort();
				requestAborted = true;
			};
			website.stop = function () {
				// waiting to monitor again
				if (waitingToMonitor == true)
					clearTimeout(waitingTimeoutId);
				// in the middle of a request
				else
					abortRequest();
			};
			var monitorAgain = function () {
				waitingToMonitor = true;
				waitingTimeoutId = setTimeout(function () {
					private.monitor(website);
				}, website.sampleRate * 1000);
			};
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
			if (method == 'POST')
			var headers = _.extend({
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': postData.length
			}, private.configHeaders);
			_.extend(options, {headers: headers});
			var req = protocol.request(options, function (res) {
				// create response error handler
				res.on('error', function (err) {
					loggers.op.error('Response Error: ' + err.message);
					updateStats.increment('responseErrors');
					monitorAgain();
				});
				// receive partial data
				res.on('data', function (chunk) {
					responseData += chunk;
					clearTimeout(requestTimeoutId);
				});
				// received all data
				res.on('end', function () {
					loggers.op.info('Successful Response');
					updateStats.increment('successfulResponse');
					if (res.statusCode == 200)
					{
						// check patterns
						var matchingString = private.foundBadPattern(website.patterns, responseData);
						if (matchingString != null)
						{
							loggers.op.error(website.url + ' (found bad patterns: ' + matchingString + ')');
							updateStats.increment('badPatternErrors');
						}
					}
					else
						loggers.op.error('Bad Response: ' + res.statusCode);
						updateStats.increment('badResponse');
					// monitor again after waiting sampleRate seconds
					monitorAgain();
				});
			});
			// create request error handler
			req.on('error', function (err) {
				// sometimes req.abort() causes an error
				// in that case, do nothing
				if (requestAborted)
					return;
				loggers.op.error('Request Error: ' + err.message);
				updateStats.increment('requestErrors');
				monitorAgain();
			});
			if (method == 'POST')
				req.write(postData);
			// send request
			req.end();
			loggers.op.info('Successful Request');
			updateStats.increment('successfulRequest');
			// start maxResponse timeout
			var requestTimeoutId = setTimeout(function () {
				abortRequest();
				updateStats.increment('timeouts');
				monitorAgain();
			}, website.maxResponseTime * 1000);
		}
	};
	var monitor = {
		init: function (config) {
			config.websites.forEach(function (websiteConfig) {
				var website = _.defaults({}, websiteConfig, config.defaults);
				var urlParts = url.parse(website.url);
				private.websites.push({
					url: website.url,
					protocol: urlParts.protocol,
					hostname: urlParts.hostname,
					port: urlParts.port,
					path: urlParts.path,
					sampleRate: website.sampleRate,
					maxResponseTime: website.maxResponseTime,
					patterns: website.patterns,
					post: website.post
				});
				private.configValidation(private.websites);
			});
			private.configHeaders = config.headers;
		},
		start: function () {
			var randomNumber = function (min, max) {
				return Math.random() * (max - min) + min;
			}
			private.websites.forEach(function (website) {
				setTimeout(function () {
					private.monitor(website);
				}, randomNumber(0, website.sampleRate) * 1000);
			});
		},
		stop: function () {
			private.websites.forEach(function (website) {
				website.stop();
				// removing stop function to free up its closure
				delete website.stop;
			});
		}
	};
	return monitor;
};