var config = {
	intervalTimerFreq: 30, // in seconds
	nagIntervalTimerFreq: 3600, // in seconds
	transport: {
		service: 'gmail',
		auth: {
			user: 'yourself@gmail.com',
			pass: 'password'
		}
	},
	mailOptions: {
		from: 'yourself@gmail.com',
		to: ['yourself@gmail.com', 'someone@gmail.com']
	}
};

module.exports = config;