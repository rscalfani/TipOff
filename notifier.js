module.exports = function(monitor, loggers, stats, config) {
	var private = {
		newEvents: [], //{name: name, state: state}
		states: {}, // url: {name: name, state: state}
		problemState: false,
		intervalTimer: null,
		emailDownReport: function() {
			if (private.newEvents.length == 0)
				return;
			var downWebsites = Object.keys(private.states).filter(function(url) {
				return private.states[url].state == 'down';
			}).map(function(url) {
				return private.states[url].name;
			}).join('\n');
			var events = private.newEvents.map(function(event) {
				return event.name + ' is ' + event.state;
			}).join('\n');
			console.log('DOWN WEBSITES:\n' + downWebsites + '\nEVENTS:\n' + events);
		},
		emailUpReport: function() {
			console.log('ALL WEBSITES ARE UP')
		}
	};
	var notifier = {
		init: function() {
			monitor.emitter.on('problem', function(name, url, message) {
				var states = private.states;
				var state = 'down';
				if (!(url in states))
				{
					states[url] = {
						name: name,
						state: 'unknown'
					};
					stats.registerWebsite(url, name, state);
				}
				if (states[url].state != 'down')
				{
					private.newEvents.push({
						name: name,
						state: state
					});
					states[url].state = 'down';
					stats.updateWebsite(url, state);
					loggers.op.trace('There is a problem with ' + name + ': ' + message);
				}
				if (!private.problemState)
				{
					private.problemState = true;
					private.emailDownReport();
					private.newEvents = [];
					private.intervalTimer = setInterval(function() {
						if (private.newEvents.length >= 1)
						{
							private.emailDownReport();
							private.newEvents = [];
						}
					}, config.intervalTimerFreq * 1000);
				}
			});

			monitor.emitter.on('no problems', function(name, url) {
				var states = private.states;
				var state = 'up';
				var firstTime = false;
				if (!(url in states))
				{
					states[url] = {
						name: name,
						state: 'unknown'
					};
					firstTime = true;
					stats.registerWebsite(url, name, state);
				}
				if (states[url].state != 'up')
				{
					if (!firstTime)
					{
						private.newEvents.push({
							name: name,
							state: state
						});
					}
					states[url].state = 'up';
					stats.updateWebsite(url, state);
					loggers.op.trace('There are NO problems with ' + name);
				}
				var allNoProblems = Object.keys(states).every(function(url) {
					return states[url].state == 'up';
				});
				if (private.problemState && allNoProblems)
				{
					private.problemState = false;
					private.emailUpReport();
					private.newEvents = [];
					clearInterval(private.intervalTimer);
				}
			});
		}
	};
	return notifier;
};