module.exports = function(loggers) {
	var private = {
		timers: {}
	};
	var timers = {
		getTimerValue: function(url, type) {
			var timer = private.timers[url][type];
			if (timer.running)
				return (Date.now() - timer.startTime) + timer.total;
			else
				return timer.total;
		},
		createTimer: function (url, type) {
			if (!(url in private.timers))
				private.timers[url] = {};
			private.timers[url][type] = {
				total: 0,
				startTime: 0,
				running: false
			};
		},
		startTimer: function (url, type) {
			var timer = private.timers[url][type];
			if (!timer.running)
			{
				timer.startTime = Date.now();
				timer.running = true;
			}
		},
		stopTimer: function (url, type) {
			var timer = private.timers[url][type];
			if (timer.running)
			{
				timer.total += Date.now() - timer.startTime;
				timer.running = false;
			}
		}
	};

//	setInterval(function() {
//		console.log('value: ' + timers.getTimerValue('http://localhost:8000/test.txt', 'up'));
//	}, 10000);
	return timers;
};