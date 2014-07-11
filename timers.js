module.exports = function(loggers) {
	var private = {
		timers: {}
	};
	var timers = {
		createTimer: function(url, type) {
			if (!(url in private.timers))
				private.timers[url] = {};
			private.timers[url][type] = {
				total: 0,
				startTime: 0,
				running: false
			};
		},
		getTimerValue: function(url, type) {
			var timer = private.timers[url][type];
			if (timer.running)
				return (Date.now() - timer.startTime) + timer.total;
			else
				return timer.total;
		},
		startTimer: function(url, type) {
			var timer = private.timers[url][type];
			if (!timer.running)
			{
				timer.startTime = Date.now();
				timer.running = true;
			}
		},
		stopTimer: function(url, type) {
			var timer = private.timers[url][type];
			if (timer.running)
			{
				timer.total += Date.now() - timer.startTime;
				timer.running = false;
			}
		}
	};
	return timers;
};