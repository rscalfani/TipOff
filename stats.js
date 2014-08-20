var deepcopy = require('deepcopy');

module.exports = function(moduleOrder, loggers, logFreq, timers, formatter) {
	var private = {
		startTime: null,
		loggingId: null,
		monitorCounters: {}, // moduleName: countersDef
		websites: {}, // url: name
		getStatsUptime: function() {
			// start time - current time
			var statsUptime = Date.now() - private.startTime;
			return private.getTime(statsUptime);
		},
		headerDashes: function(buffer) {
			var longestLength = formatter.getLongestLineLength(buffer);
			var header = '';
			for (var i = 0; i < longestLength; ++i)
				header += '-';
			return header;
		},
		formatCounters: function() {
			var formatted = '';
			moduleOrder.forEach(function(moduleName) {
				var countersDef = private.monitorCounters[moduleName];
				if (countersDef)
				{
					var header = '\n\nModule: ' + moduleName + '\n';
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
					header += private.headerDashes(buffer);
					formatted += header + '\n' + buffer.join('\n');
				}
			});
			// return big string to be logged
			return formatted;
		},
		getTime: function(ms) {
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
			return days + ' day' + (days != 1 ? 's' : '') + ', ' + formatter.padLeft(hrs, 2, '0') + ':' + formatter.padLeft(mins, 2, '0') + ':' + formatter.padLeft(secs, 2, '0');
		},
		formatTimers: function() {
			var formatted = '';
			var websites = private.websites;
			var urls = Object.keys(websites);
			var header = '\n\nWebsite Stats\n';
			var buffer = formatter.createBuffer(urls.length);
			var names = urls.map(function(url) {
				return websites[url];
			});
			var getTimers = function(type) {
				return urls.map(function(url) {
					return private.getTime(timers.getTimerValue(url, type));
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
			header += private.headerDashes(buffer);
			formatted += header + '\n' + buffer.join('\n');
			return formatted;
		}
	};
	var stats = {
		registerWebsite: function(url, name, state) {
			private.websites[url] = name;
			['up', 'down'].forEach(function(type) {
				timers.createTimer(url, type);
			});
			timers.startTimer(url, state);
		},
		updateWebsite: function(url, state) {
			timers.stopTimer(url, state == 'up' ? 'down' : 'up');
			timers.startTimer(url, state);
		},
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
		start: function() {
			loggers.op.warn('Starting Stats');
			private.startTime = Date.now();
			if (!private.loggingId)
			{
				private.loggingId = setInterval(function(){
					loggers.stats.info('Stats Since: ' + private.getStatsUptime());
					loggers.stats.info(private.formatCounters());
					loggers.stats.info(private.formatTimers());
				}, logFreq * 1000);
			}
		},
		stop:function() {
			loggers.op.warn('Stopping Stats');
			if (private.loggingId)
				clearInterval(private.loggingId);
			private.loggingId = null;
		},
		getTime: function(url, type) {
			return private.getTime(timers.getTimerValue(url, type));
		}
	};
	return stats;
};