var forever = require('forever-monitor');
var log4js = require('log4js');
log4js.configure(require('./loggingConfig'));
var logger = log4js.getLogger('forever');

var child = new (forever.Monitor)('app.js', {
	silent: false,
	max: 100,
	killTree: true,
	killSignal: 'SIGTERM',
	minUptime: 60000,
	spinSleepTime: 5000,
	pidFile: '/tmp/forever.pid',
	logFile: '/tmp/forever.log',
	outFile: '/tmp/forever.out',
	errFile: '/tmp/forever.err',
	watch: true,
	watchDirectory: '/tmp/TipOff.watch'
});

child.on('restart', function() {
	logger.error('app is restarting');
});

child.on('exit', function() {
	logger.error('app has exited after ' + child.max + ' number of tries');
});

child.start();

