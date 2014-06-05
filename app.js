var log4js = require('log4js');
log4js.configure(require('./loggingConfig'));
var loggers = {
	op: log4js.getLogger('op'),
	stats: log4js.getLogger('stats')
};
var config = require('./config');
var stats = require('./stats')(['monitor', 'notifier'], loggers.stats, config.statsFreq);
var monitor = require('./monitor')(loggers, stats);
var monitorConfig = require('./monitorConfig');

process.on('uncaughtException', function(err) {
	loggers.op.fatal('caught exception: ' + err.stack);
	process.exit(1);
});
monitor.init(monitorConfig);
monitor.start();
stats.startLogging();