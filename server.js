var startUp = function() {
	var _ = require('underscore');
	var serverConfig = require ('./configs/serverConfig');

	var forever = require('forever-monitor');
	var log4js = require('log4js');
	log4js.configure(require('./configs/loggingConfig'));
	var logger = log4js.getLogger('forever');

	var child = new (forever.Monitor)('app.js', _.extend({
		silent: false,
		max: 100,
		killTree: true,
		killSignal: 'SIGTERM',
		minUptime: 60000,
		spinSleepTime: 5000,
		options: ['--forever']
	}, serverConfig));

	child.on('restart', function() {
		logger.error('app is restarting');
	});

	child.on('exit', function() {
		logger.error('app has exited after ' + child.max + ' number of tries');
	});

	child.start();
};

var argv = require('optimist')
	.usage('Usage:\n$0 --configPath <path>')
	.string('configPath')
	.describe('configPath', 'path to directory that contains only TipOff config files')
	.argv;
var fs = require('fs');
if (!fs.existsSync('configs'))
	fs.mkdirSync('configs', 0755);
var exec = require('child_process').exec;
exec('cp ' + argv.configPath + '/*onfig.js configs/', function(err, stdout, stderr) {
	if (err) {
		console.log(stdout);
		console.log(stderr);
	}
	else
		startUp();
});