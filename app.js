var log4js = require('log4js');
log4js.configure(require('./loggingConfig'));
var loggers = {
	op: log4js.getLogger('op'),
	stats: log4js.getLogger('stats')
};
var config = require('./config');
var timers = require('./timers')(loggers);
var stats = require('./stats')(['monitor', 'notifier'], loggers, config.statsFreq, timers);
var monitorConfig = require('./monitorConfig');
var monitor = require('./monitor')(loggers, stats, monitorConfig);
var notifierConfig = require('./notifierConfig');
var notifier = require('./notifier')(monitor, loggers, stats, notifierConfig);

process.on('uncaughtException', function(err) {
	loggers.op.fatal('caught exception: ' + err.stack);
	process.exit(1);
});

monitor.init();
monitor.start();
stats.startLogging();
notifier.init();