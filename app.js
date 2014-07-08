var log4js = require('log4js');
log4js.configure(require('./loggingConfig'));
var loggers = {
	op: log4js.getLogger('op'),
	stats: log4js.getLogger('stats')
};
var config = require('./config');
var timers = require('./timers')(loggers);
var formatter = require('./formatter')();
var stats = require('./stats')(['monitor', 'notifier'], loggers, config.statsFreq, timers, formatter);
var monitorConfig = require('./monitorConfig');
var monitor = require('./monitor')(loggers, stats, monitorConfig);
var notifierConfig = require('./notifierConfig');
var notifier = require('./notifier')(loggers, formatter, stats, monitor, notifierConfig);

process.on('uncaughtException', function(err) {
	loggers.op.fatal('uncaught exception: ' + err.stack);
	process.exit(1);
});

var exit = function(type) {
	return function() {
		loggers.op.info('exiting, received: ' + type);
		monitor.stop();
		stats.stop();
		notifier.stop();
		log4js.shutdown(function() {
			process.exit(1);
		});
	};
};

process.on('SIGTERM', exit('SIGTERM'));
process.on('SIGINT', exit('SIGINT'));

monitor.init();
monitor.start();
stats.start();
notifier.init();
notifier.start();