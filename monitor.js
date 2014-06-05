var _ = require('underscore');
var http = require('http');
var https = require ('https');
var url = require('url');

var o = 0;
var countersDef = {
	badPatternErrors: {order: o++, displayName: 'Bad Pattern Errors'},
	responseErrors: {order: o++, displayName: 'Response Errors'},
	requestErrors: {order: o++, displayName: 'Request Errors'},
	timeouts: {order: o++, displayName: 'Timeouts'}
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
			var options = {
				host: website.hostname,
				port: website.port,
				path: website.path,
				method: 'GET'
			};
			var req = protocol.request(options, function (res) {
				// receive partial data
				res.on('data', function (chunk) {
					responseData += chunk;
					clearTimeout(requestTimeoutId);
				});
				// received all data
				res.on('end', function () {
					// check patterns
					var matchingString = private.foundBadPattern(website.patterns, responseData);
					if (matchingString != null)
						loggers.op.error(website.url + ' (found bad patterns: ' + matchingString + ')');
						updateStats.increment('badPatternErrors');
					// monitor again after waiting sampleRate seconds
					monitorAgain();
				});
				// create response error handler
				res.on('error', function (err) {
					monitorAgain();
					loggers.op.error("Response Error: " + err.message);
					updateStats.increment('responseErrors');
				});
			});
			// create request error handler
			req.on('error', function (err) {
				// sometimes req.abort() causes an error
				// in that case, do nothing
				if (requestAborted)
					return;
				monitorAgain();
				loggers.op.error("Request Error: " + err.message);
				updateStats.increment('requestErrors');
			});
			// send request
			req.end();
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
					patterns: website.patterns
				});
				private.configValidation(private.websites);
			});
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