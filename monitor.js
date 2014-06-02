var http = require('http');
var https = require ('https');
var url = require('url');
var _ = require('underscore');

var private = {
	foundBadPattern: function(patterns, data) {
		var matchingString = null;
		patterns.some(function(pattern) {
			var result = data.match(pattern);
			if (result != null)
			{
				matchingString = result[0];
				return true;
			}
		});
		return matchingString;
	},
	configValidation : function(websites) {
		websites.forEach(function(website) {
			if (website.maxResponseTime < website.sampleRate)
				throw new Error('maxResponseTime of ' + website.hostname+ ' must be equal to or greater than its sampleRate');
		});
	},
	websites: [],
	monitor: function(website) {
		var requestAborted = false;
		var waitingToMonitor = false;
		var waitingTimeoutId;
		var abortRequest = function()
		{
			req.abort();
			requestAborted = true;
		};
		website.stop = function() {
			// waiting to monitor again
			if(waitingToMonitor == true)
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
		// create request
		var responseData = '';
		var protocol = (website.protocol == 'http:' ? http : https);
		var options = {
			host: website.hostname,
			port: website.port,
			path: website.path,
			method: 'GET'
		};
		var req = protocol.request(options, function(res) {
			// receive partial data
			res.on('data', function(chunk) {
				responseData += chunk;
				clearTimeout(requestTimeoutId);
			});
			// received all data
			res.on('end', function() {
				// check patterns
				var matchingString = private.foundBadPattern(website.patterns, responseData);
				if (matchingString != null)
					console.log(website.url + ' (found bad patterns: ' + matchingString + ')');
				// monitor again after waiting sampleRate seconds
				monitorAgain();
			});
			// create response error handler
			res.on('error', function(err) {
				monitorAgain();
				console.log("Response Error: " + err.message);
			});
		});
		// create request error handler
		req.on('error', function(err) {
			// sometimes req.abort() causes an error
			// in that case, do nothing
			if (requestAborted)
				return;
			monitorAgain();
			console.log("Request Error: " + err.message);
		});
		// send request
		req.end();
		// start maxResponse timeout
		var requestTimeoutId = setTimeout(function() {
			abortRequest();
			monitorAgain();
		}, website.maxResponseTime * 1000);
	}
};
var monitor = {
	init: function(config) {
		config.websites.forEach(function(websiteConfig) {
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
	start: function() {
		var randomNumber = function(min, max) {
			return Math.random() * (max - min) + min;
		}
		private.websites.forEach(function (website) {
			setTimeout (function() {
				private.monitor(website);
			}, randomNumber(0, website.sampleRate) * 1000);
//			console.log('website: ' + website.hostname);
		});
	},
	stop: function() {
		private.websites.forEach(function(website) {
			website.stop();
			// removing stop function to free up its closure
			delete website.stop;
		});
	}
};

module.exports = monitor;