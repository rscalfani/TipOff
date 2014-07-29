module.exports = {
	appenders: [
		{
			type: 'file',
			filename: '/tmp/test.log',
			maxLogSize: 20 * 1024 * 1024,
			backups: 3
		},
		{
			type: 'logLevelFilter',
			level: 'ERROR',
			appender: {
				type: 'smtp',
				sender: 'rscalfani@gmail.com',
				recipients: 'rscalfani@gmail.com',
				subject: 'TipOff: Error Report',
				transport: 'SMTP',
				SMTP: {
					host: 'mailtrap.io',
					port: 465,
					auth: {
						user: '21426859fad676806',
						pass: '01d93f1d839a96'
					}
				}
			}
		}
	],
	levels: {
		op: 'INFO',
		stats: 'INFO',
		forever: 'ERROR'
	}
};