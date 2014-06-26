var config = {
	defaults: {
		sampleRate: 10, // in seconds
		maxResponseTime: 10 // in seconds
	},
	websites: [
		{
			name: 'Google',
			url: 'https://www.google.com',
			sampleRate: 15, // in seconds
			maxResponseTime: 20, // in seconds
			patterns: [
				/error/i,
				/not found/i
			]
		},
		{
			name: 'Local Host',
			url: 'http://localhost:8000/test.txt',
			patterns: [
				/test/i
			]
		},
		{
			name: 'Panosoft',
			url: 'https://demo.panosoft.com/DemoPAPG/logon.do?query=user',
			patterns: [
				/invalid user or password/i
			],
			post: {
				'user.usrname': 'Joe',
				password: 'Mama',
				score: 0,
				complexity: 0
			}
		}

	],
	headers: {
//		test: 'headers are working'
	}
};

module.exports = config;