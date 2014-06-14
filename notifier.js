module.exports = function(monitor, loggers, stats) {
	var private = {
		states: {} // url:state
	};
	var UNKNOWN = -1;
	var NO_PROBLEMS = 0;
	var PROBLEM = 1;
	var notifier = {
		init: function() {
			monitor.emitter.on('problem', function(name, url, message) {
				var states = private.states;
				var state = 'down';
				if (!(url in states))
				{
					states[url] = UNKNOWN;
					stats.registerWebsite(url, name, state);
				}
				else
					stats.updateWebsite(url, state);
				if (states[url] != PROBLEM)
				{
					states[url] = PROBLEM;
					loggers.op.trace('There is a problem with ' + name + ': ' + message);
				}
			});

			monitor.emitter.on('no problems', function(name, url) {
				var states = private.states;
				var state = 'up';

				if (!(url in states))
				{
					states[url] = UNKNOWN;
					stats.registerWebsite(url, name, state);
				}
				else
					stats.updateWebsite(url, state);
				if (states[url] != NO_PROBLEMS)
				{
					states[url] = NO_PROBLEMS;
					loggers.op.trace('There are NO problems with ' + name);
				}
			});
		}
	};
	return notifier;
};