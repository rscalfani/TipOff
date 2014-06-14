var deepcopy = require('deepcopy');

module.exports = function(moduleOrder, loggers, logFreq) {
	var logger = loggers.stats;
	var timers = require('./timers')(loggers);
	var private = {
		loggingId: null,
		monitorCounters: {}, // moduleName: countersDef
		websites: {}, // url: name
		getLongestLength: function(list) {
				var longestLength = 0;
				list.forEach(function(item) {
					if (item && item.length > longestLength)
						longestLength = item.length;
				});
				return longestLength;
		},
		padRight: function(str, length) {
			str = str || '';
			var numberOfSpaces = length - str.length;
			for (var i = 0; i < numberOfSpaces; ++i)
				str = str + ' ';
			return str;
		},
		padLeft: function(str, length) {
			str = str || '';
			var numberOfSpaces = length - str.length;
			for (var i = 0; i < numberOfSpaces; ++i)
				str = ' ' + str;
			return str;
		},
		formatCounters: function() {
			var formatted = '';
			moduleOrder.forEach(function(moduleName) {
				var countersDef = private.monitorCounters[moduleName]
				if (countersDef)
				{
					formatted += 'Module: ' + moduleName + '\n';
					var list = function(key) {
						return Object.keys(countersDef).map(function(counterName) {
							return countersDef[counterName][key];
						});
					};
					var mapDate = function(ticks) {
						if (ticks)
							return '[' + new Date(ticks) + ']';
					};
					var longestDisplayName = private.getLongestLength(list('displayName')) + 10;
					var longestCounter = private.getLongestLength(list('counter').map(String)) + 10;
					var longestLastUpdated = private.getLongestLength(list('lastUpdated').map(mapDate)) + 10;

					Object.keys(countersDef).forEach(function(counterName) {
						var displayName = private.padRight(countersDef[counterName].displayName, longestDisplayName);
						var counter = private.padLeft(String(countersDef[counterName].counter), longestCounter);
						var lastUpdated = private.padLeft(mapDate(countersDef[counterName].lastUpdated), longestLastUpdated);
						formatted += displayName + counter + (lastUpdated || '') + '\n';
					});
				}
			});
			// return big string to be logged
			return formatted;
		},
		formatTimers: function() {
			var formatted = '';
			Object.keys(private.websites).forEach(function(url) {
				['up', 'down'].forEach(function(type) {
					formatted += type + 'time for ' + private.websites[url] + ' ' + timers.getTimerValue(url, type) + '\n';
				});
			});

			// TODO finish formatting ^


			return formatted;
		}
	};
	var stats = {
		registerCounters: function(moduleName, countersDef) {
			countersDef = deepcopy(countersDef);
			// saves countersDef for specified module
			private.monitorCounters[moduleName] = countersDef;
			// add and initialize counters
			Object.keys(countersDef).forEach(function(counterName) {
				countersDef[counterName].counter = 0;
			});
			var countersDef = private.monitorCounters[moduleName];
			return {
				increment: function(counterName){
					++countersDef[counterName].counter;
					countersDef[counterName].lastUpdated = Date.now();
				},
				reset: function(counterName){
					countersDef[counterName].counter = 0;
				}
			};
		},
		startLogging: function() {
			if (!private.loggingId)
			{
				logger.info(private.formatCounters()); // TODO remove after testing
				logger.info(private.formatTimers()); // TODO remove after testing
				private.loggingId = setInterval(function(){
					logger.info(private.formatCounters());
					logger.info(private.formatTimers());
				}, logFreq * 1000);
			}
		},
		stopLogging:function() {
			if (private.loggingId)
				clearInterval(private.loggingId);
			private.loggingId = null;
		},
		registerWebsite: function(url, name, state) {
			private.websites[url] = name;
			['up', 'down'].forEach(function(type) {
				timers.createTimer(url, type);
			});
			timers.startTimer(url, state);
		},
		updateWebsite: function(url, state) {
//			if (state == 'up')
//				timers.stopTimer(url, 'down');
//			else
//				timers.stopTimer(url, 'up');
			timers.stopTimer(url, state == 'up' ? 'down' : 'up');
			timers.startTimer(url, state);
		}
	};
	return stats;
};