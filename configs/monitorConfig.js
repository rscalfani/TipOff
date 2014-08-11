var fs = require('fs');

module.exports = {
	defaults: {
		sampleRate: 10, // in seconds
		maxResponseTime: 10 // in seconds
	},
	websites: [
		{
			name: 'Local Host',
			url: 'http://localhost:8000/test.txt',
			patterns: [
				/test/i
			]
		},
		{
			name: 'Dummy',
			url: 'https://demo.dummy.com/Demo/logon.do',
			patterns: [
				/invalid user or password/i
			],
			post: {
				user: 'Joe',
				password: 'Mama'
			}
		},
		{
			name: 'Facebook',
			url: 'http://www.facebook.com',
			sampleRate: 15, // in seconds
			maxResponseTime: 20, // in seconds
			patterns: [
				/error/i,
				/not found/i
			],
			httpOptions: {
				headers: {
					'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.1916.153 Safari/537.36'
				}
			}
		}
	]
};