var _ = require('underscore');
var nodemailer = require('nodemailer');

var countersDef = {
	emailsSent: {displayName: 'Emails Sent'}
};

module.exports = function(loggers, formatter, stats, monitor, config) {
	var updateStats = stats.registerCounters('notifier', countersDef);
	var private = {
		newEvents: [], //{name: name, state: state}
		states: {}, // url: {name: name, state: state}
		problemState: false,
		intervalTimer: null,
		lastDownReport: '',
		nagTimer: null,
		configValidation: function() {
			if (config.nagIntervalTimerFreq < config.intervalTimerFreq)
				throw new Error('nagIntervalTimerFreq must be greater than intervalTimerFreq');
		},
		email: function(text, reportType) {
			text = text.replace(/\n/g, '<br/>\n').replace(/ /g, '&nbsp;');
			var transport = nodemailer.createTransport(config.transport);
			var mailOptions = _.extend(config.mailOptions, {
				subject: 'TipOff: ' + reportType + ' Report',
				html: '<div style="font-family: \'Courier New\', Courier, monospace">' + text + '</div>'
			});
			transport.sendMail(mailOptions);
			updateStats.increment('emailsSent');
		},
		emailDownReport: function(reportType) {
			reportType = reportType || 'Down';
			if (reportType == 'Down')
			{
				var downUrls = Object.keys(private.states).filter(function(url) {
					return private.states[url].state == 'down';
				});
				var downWebsites = downUrls.map(function(url) {
					return private.states[url].name;
				});
				var getEventItems = function(eventItem) {
					return private.newEvents.map(function(event) {
						return event[eventItem];
					});
				};
				var downWebsitesBuffer = formatter.createBuffer(downWebsites.length);
				formatter.addColumnToBuffer(downWebsitesBuffer, downWebsites, 5, formatter.padRight);
				formatter.addRepeatingColumn(downWebsitesBuffer, '    ');
				formatter.addColumnToBuffer(downWebsitesBuffer, downUrls.map(function(url) {
					return stats.getTime(url, 'down');
				}), 1, formatter.padLeft);
				var emailText = 'DOWN WEBSITES (' + downWebsites.length + '):\n' + downWebsitesBuffer.join('\n');
				if (private.newEvents.length)
				{
					var eventsBuffer = formatter.createBuffer(getEventItems('name').length);
					formatter.addColumnToBuffer(eventsBuffer, getEventItems('name'), 5, formatter.padRight);
					formatter.addColumnToBuffer(eventsBuffer, getEventItems('state'), 1, formatter.padRight);
					formatter.addRepeatingColumn(eventsBuffer, '    ');
					formatter.addColumnToBuffer(eventsBuffer, getEventItems('date').map(function(ticks) {
						return '[' + new Date(ticks) + ']';
					}), 1, formatter.padLeft);
					emailText += '\n\nEVENTS:\n' + eventsBuffer.join('\n');
				}
				private.lastDownReport = emailText;
			}
			else
				emailText = private.lastDownReport;
			private.email(emailText, reportType);
			clearTimeout(private.nagTimer);
			private.nagTimer = setTimeout(function() {
				private.emailDownReport('Nag');
			}, config.nagIntervalTimerFreq * 1000);
		},
		emailUpReport: function() {
			private.email('ALL WEBSITES ARE UP', 'Up');
		}
	};
	var notifier = {
		init: function() {
			private.configValidation();
		},
		start: function() {
			loggers.op.warn('Starting Notifier');
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
					clearInterval(private.nagTimer);
					private.newEvents.push({
						name: name,
						state: state,
						date: Date.now()
					});
					states[url].state = 'down';
					stats.updateWebsite(url, state);
					loggers.op.trace('There is a Problem with ' + name + ': ' + message);
				}
				if (!private.problemState)
				{
					private.problemState = true;
					private.emailDownReport();
					private.newEvents = [];
					private.intervalTimer = setInterval(function() {
						if (private.newEvents.length)
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
					clearInterval(private.nagTimer);
					if (!firstTime) // don't want to put 'website is up' in events unless the website went down first
					{
						private.newEvents.push({
							name: name,
							state: state,
							date: Date.now()
						});
					}
					states[url].state = 'up';
					stats.updateWebsite(url, state);
					loggers.op.trace('There are NO Problems with ' + name);
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
		},
		stop: function() {
			loggers.op.warn('Stopping Notifier');
			monitor.emitter.removeAllListeners();
			clearInterval(private.intervalTimer);
			clearInterval(private.nagTimer);
		}
	};
	return notifier;
};