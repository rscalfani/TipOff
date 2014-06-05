var config = {
	defaults: {
		sampleRate: 10, // in seconds
		maxResponseTime: 10 // in seconds
	},
	websites: [
		{
			url: 'https://www.google.com',
			sampleRate: 15, // in seconds
			maxResponseTime: 20, // in seconds
			patterns: [
				/error/i,
				/not found/i
			]
		},
		{
			url: 'http://localhost:8000/test.txt',
			patterns: [
				/test/i
			]
		}
	]
};

module.exports = config;