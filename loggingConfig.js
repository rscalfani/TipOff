module.exports = {
	appenders: [
		{
			type: 'file',
			filename: '/tmp/test.log',
			alwaysIncludePattern: true,
			maxLogSize: 1000, //20 * 1024 * 1024,
			backups: 3
		},
		{
			type: 'console'
		}
	],
	levels: {
		op: 'WARN',
		stats: 'INFO'
	}
};
