var argv = require('optimist')
	.usage('Usage:\n$0 --configPath <path>')
	.string('configPath')
	.demand (['configPath'])
	.describe('configPath', 'path to directory that contains only TipOff config files')
	.argv;

var _ = require('underscore');
var serverConfig = require (argv.configPath + '/serverConfig');

var forever = require('forever-monitor');
var log4js = require('log4js');
log4js.configure(require(argv.configPath + '/loggingConfig'));
var logger = log4js.getLogger('forever');

var child = new (forever.Monitor)('app.js', _.extend({
	silent: false,
	max: 100,
	killTree: true,
	killSignal: 'SIGTERM',
	minUptime: 60000,
	spinSleepTime: 5000,
	options: ['--configPath', argv.configPath]
}, serverConfig));

child.on('restart', function() {
	logger.error('app is restarting');
});

child.on('exit', function() {
	logger.error('app has exited after ' + child.max + ' number of tries');
});

child.start();