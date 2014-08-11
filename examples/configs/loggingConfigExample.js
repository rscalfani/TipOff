module.exports = {
	appenders: [
		{
			// writes all logs to a log file
			type: 'file',
			filename: '/tmp/test.log', // path to log file
			maxLogSize: 20 * 1024 * 1024,
			backups: 3
		},
		{
			// will only send emails for errors
			type: 'logLevelFilter',
			level: 'ERROR',
			appender: {
				type: 'smtp',
				sender: 'yourself@gmail.com',
				recipients: ['yourself@gmail.com', 'someone@gmail.com'],
				subject: 'TipOff: Error Report',
				transport: {
					service: 'gmail',
					auth: {
						user: 'yourself@gmail.com',
						pass: 'password'
					}
				}
			}
		}
	]
};