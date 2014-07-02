var fs = require('fs');

var config = {
	defaults: {
		sampleRate: 10, // in seconds
		maxResponseTime: 10 // in seconds
	},
	websites: [
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
		},
		{
			name: 'Local Host',
			url: 'http://localhost:8000/test.txt',
			patterns: [
				/test/i
			]
		},
//		{
//			name: 'Vet Pro',
//			url: 'https://localhost:8443/VetProWeb',
//			sampleRate: 15, // in seconds
//			maxResponseTime: 20, // in seconds
//			patterns: [
//				/exception/i
//			],
//			httpOptions: {
//				ca: [fs.readFileSync('/Users/rscalfani/Downloads/rootCA.pem')]
//			}
//		},
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
	]
};

module.exports = config;