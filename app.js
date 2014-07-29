var log4js = require('log4js');
log4js.configure(require('./loggingConfig'));
var loggers = {
	op: log4js.getLogger('op'),
	stats: log4js.getLogger('stats')
};
var apiConfig = require('./apiConfig');
var api = require('./api')(loggers, apiConfig);
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
		api.stop();
		monitor.stop();
		stats.stop();
		notifier.stop();
		log4js.shutdown(function() {
			process.exit(1);
		});
	};
};

process.on('SIGINT', exit('SIGINT'));
process.on('SIGTERM', exit('SIGTERM'));

api.start();
monitor.init();
monitor.start();
stats.start();
notifier.init();
notifier.start();
// app passes functions from monitor to api
api.init({
	startGrace: monitor.startGrace,
	stopGrace: monitor.stopGrace
});