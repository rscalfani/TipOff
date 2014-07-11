var config = {
	intervalTimerFreq: 30, // in seconds
	nagIntervalTimerFreq: 3600,// in seconds
	transport: {
		host: 'mailtrap.io',
		port: 465,
		auth: {
			user: '21426859fad676806',
			pass: '01d93f1d839a96'
		}
	},
	mailOptions: {
		from: 'rscalfani@gmail.com',
		to: 'rscalfani@gmail.com'
	}
};

module.exports = config;