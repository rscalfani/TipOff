var deepcopy = require('deepcopy');

module.exports = function(moduleOrder, loggers, logFreq, timers) {
	var logger = loggers.stats;
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
		padRight: function(str, length, pad) {
			str = str || '';
			str = String(str);
			pad = pad || ' ';
			var numberOfSpaces = length - str.length;
			for (var i = 0; i < numberOfSpaces; ++i)
				str = str + pad;
			return str;
		},
		padLeft: function(str, length, pad) {
			str = str || '';
			str = String(str);
			pad = pad || ' ';
			var numberOfSpaces = length - str.length;
			for (var i = 0; i < numberOfSpaces; ++i)
				str = pad + str;
			return str;
		},
		createBuffer: function(length) {
			// hack to convert an empty array to one with undefined values so we can use map
			// ex: Array(3) --> [ , , ]
			// ex: Array.apply(null, Array(3)) --> [undefined, undefined, undefined]
			return Array.apply(null, Array(length)).map(function () {
				return '';
			});
		},
		addRepeatingColumn: function(buffer, column) {
			buffer.forEach(function(item, index) {
				buffer[index] += column;
			});
		},
		addColumnToBuffer: function(buffer, column, columnPad, padFunc) {
			var longestLength = private.getLongestLength(column) + columnPad;
			column.forEach(function(item, index) {
				buffer[index] += padFunc(item, longestLength);
			});
		},
		formatCounters: function() {
			var formatted = '';
			moduleOrder.forEach(function(moduleName) {
				var countersDef = private.monitorCounters[moduleName]
				if (countersDef)
				{
					formatted += 'Module: ' + moduleName + '\n';
					var buffer = private.createBuffer(Object.keys(countersDef).length);
					var list = function(key) {
						return Object.keys(countersDef).map(function(counterName) {
							return countersDef[counterName][key];
						});
					};
					private.addColumnToBuffer(buffer, list('displayName'), 10, private.padRight);
					private.addColumnToBuffer(buffer, list('counter').map(String), 10, private.padLeft);
					private.addRepeatingColumn(buffer, '          ');
					private.addColumnToBuffer(buffer, list('lastUpdated').map(function(ticks) {
						if (ticks)
							return '[' + new Date(ticks) + ']';
						else
							return '';
					}), 10, private.padRight);
					formatted += buffer.join('\n');
				}
			});
			// return big string to be logged
			return formatted;
		},
		formatTimers: function() {
			var formatted = '\n';
			var websites = private.websites;
			var urls = Object.keys(websites);
			var buffer = private.createBuffer(urls.length);
			var names = urls.map(function (url) {
				return websites[url];
			});
			var getTime = function(ms) {
				var secs = Math.floor(ms / 1000);
				var days = Math.floor(secs / (24 * 60 * 60));
				secs -= days * 24 * 60 * 60;
				var hours = Math.floor(secs / (60 * 60));
				secs -= hours * 60 * 60;
				var mins = Math.floor(secs / 60);
				secs -= mins * 60;
				return days + ' days, ' + private.padLeft(hours, 2, '0') + ':' + private.padLeft(mins, 2, '0') + ':' + private.padLeft(secs, 2, '0');
			};
			var getTimers = function(type) {
				return urls.map(function (url) {
					return getTime(timers.getTimerValue(url, type));
				});
			};
			var uptimes = getTimers('up');
			var downtimes = getTimers('down');
			var getPercentages = function () {
				var totals = urls.map(function (url) {
					return timers.getTimerValue(url, 'up') + timers.getTimerValue(url, 'down');
				});
				return urls.map(function (url, index) {
					return Math.round((timers.getTimerValue(url, 'up') / totals[index]) * 100) + '%';
				});
			};
			private.addColumnToBuffer(buffer, names, 5, private.padRight);
			private.addRepeatingColumn(buffer, '   uptime:');
			private.addColumnToBuffer(buffer, uptimes, 1, private.padLeft);
			private.addRepeatingColumn(buffer, '        downtime:');
			private.addColumnToBuffer(buffer, downtimes, 1, private.padLeft);
			private.addRepeatingColumn(buffer, '        (up:');
			private.addColumnToBuffer(buffer, getPercentages(), 1, private.padLeft);
			private.addRepeatingColumn(buffer, ')');
			formatted += buffer.join('\n');
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