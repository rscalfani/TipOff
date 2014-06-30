var deepcopy = require('deepcopy');

module.exports = function(moduleOrder, loggers, logFreq, timers, formatter) {
	var logger = loggers.stats;
	var private = {
		loggingId: null,
		monitorCounters: {}, // moduleName: countersDef
		websites: {}, // url: name
		formatCounters: function() {
			var formatted = '';
			moduleOrder.forEach(function(moduleName) {
				var countersDef = private.monitorCounters[moduleName];
				if (countersDef)
				{
					formatted += 'Module: ' + moduleName + '\n';
					var buffer = formatter.createBuffer(Object.keys(countersDef).length);
					var list = function(key) {
						return Object.keys(countersDef).map(function(counterName) {
							return countersDef[counterName][key];
						});
					};
					formatter.addColumnToBuffer(buffer, list('displayName'), 10, formatter.padRight);
					formatter.addColumnToBuffer(buffer, list('counter').map(String), 10, formatter.padLeft);
					formatter.addRepeatingColumn(buffer, '          ');
					formatter.addColumnToBuffer(buffer, list('lastUpdated').map(function(ticks) {
						if (ticks)
							return '[' + new Date(ticks) + ']';
						else
							return '';
					}), 10, formatter.padRight);
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
			var buffer = formatter.createBuffer(urls.length);
			var names = urls.map(function(url) {
				return websites[url];
			});
			var getTime = function(ms) {
				// secs = ms/how many ms in a sec (1000 ms = 1 sec)
				var secs = Math.floor(ms / 1000);
				// days = secs/how many secs in a day (24 [hrs in day] * 60 [mins in hr] * 60 [secs in min])
				var days = Math.floor(secs / (24 * 60 * 60));
				// secs = secs - (days * how many secs in a day) OR secs - days in secs unit
				secs -= days * 24 * 60 * 60;
				// hrs = secs/how many secs in an hr (60 [mins in hour] * 60 [secs in min])
				var hrs = Math.floor(secs / (60 * 60));
				// secs = secs - (hrs * how many secs in an hr) OR secs - hrs in secs unit
				secs -= hrs * 60 * 60;
				// mins = secs/how many secs in a min (60 secs = 1 min)
				var mins = Math.floor(secs / 60);
				// secs = secs - (mins * how many secs in min) OR secs - mins in secs unit
				secs -= mins * 60;
				return days + ' days, ' + formatter.padLeft(hrs, 2, '0') + ':' + formatter.padLeft(mins, 2, '0') + ':' + formatter.padLeft(secs, 2, '0');
			};
			var getTimers = function(type) {
				return urls.map(function(url) {
					return getTime(timers.getTimerValue(url, type));
				});
			};
			var uptimes = getTimers('up');
			var downtimes = getTimers('down');
			var getPercentages = function() {
				var totals = urls.map(function(url) {
					return timers.getTimerValue(url, 'up') + timers.getTimerValue(url, 'down');
				});
				return urls.map(function(url, index) {
					return Math.round((timers.getTimerValue(url, 'up') / totals[index]) * 100) + '%';
				});
			};
			formatter.addColumnToBuffer(buffer, names, 5, formatter.padRight);
			formatter.addRepeatingColumn(buffer, '   uptime:');
			formatter.addColumnToBuffer(buffer, uptimes, 1, formatter.padLeft);
			formatter.addRepeatingColumn(buffer, '        downtime:');
			formatter.addColumnToBuffer(buffer, downtimes, 1, formatter.padLeft);
			formatter.addRepeatingColumn(buffer, '        (up:');
			formatter.addColumnToBuffer(buffer, getPercentages(), 1, formatter.padLeft);
			formatter.addRepeatingColumn(buffer, ')');
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