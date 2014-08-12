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
	spinSleepTime: 5000
}, serverConfig));

child.on('restart', function() {
	logger.error('app is restarting');
});

child.on('exit', function() {
	logger.error('app has exited after ' + child.max + ' number of tries');
});

child.start();