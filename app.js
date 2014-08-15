var startUp = function() {
	var log4js = require('log4js');
	log4js.configure(require('./configs/loggingConfig'));
	var loggers = {
		op: log4js.getLogger('op'),
		stats: log4js.getLogger('stats')
	};
	var apiConfig = require('./configs/apiConfig');
	var api = require('./api')(loggers, apiConfig);
	var config = require('./configs/config');
	var timers = require('./timers')(loggers);
	var formatter = require('./formatter')();
	var stats = require('./stats')(['monitor', 'notifier'], loggers, config.statsFreq, timers, formatter);
	var monitorConfig = require('./configs/monitorConfig');
	var monitor = require('./monitor')(loggers, stats, monitorConfig);
	var notifierConfig = require('./configs/notifierConfig');
	var notifier = require('./notifier')(loggers, formatter, stats, monitor, notifierConfig);

	process.on('uncaughtException', function (err) {
		loggers.op.fatal('uncaught exception: ' + err.stack);
		process.exit(1);
	});

	var exit = function (type) {
		return function () {
			loggers.op.info('exiting, received: ' + type);
			api.stop();
			monitor.stop();
			stats.stop();
			notifier.stop();
			log4js.shutdown(function () {
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
};

var argv = require('optimist')
	.usage('Usage:\n$0 --configPath <path>')
	.boolean('forever')
	.string('configPath')
	.describe('configPath', 'path to directory that contains only TipOff config files')
	.argv;
if (argv.forever)
	startUp();
else
{
	var fs = require('fs');
	if (!fs.existsSync('configs'))
		fs.mkdirSync('configs', 0755);
	var exec = require('child_process').exec;
	exec('cp ' + argv.configPath + '/*onfig.js ' + __dirname + '/configs/', function(err, stdout, stderr) {
		if (err) {
			console.log(stdout);
			console.log(stderr);
		}
		else
			startUp();
	});
}