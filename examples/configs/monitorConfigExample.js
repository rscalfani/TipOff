var fs = require('fs'); // file system

module.exports = {
	defaults: { // applies sampleRate and maxResponseTime if not specified
		sampleRate: 10, // in seconds
		maxResponseTime: 10 // in seconds
	},
	websites: [
		{
			name: 'Website',
			url: 'https://website.com/path',
			// sampleRate: 10 //in seconds
			// maxResponseTime: 10 // in seconds
			patterns: [
				/invalid user or password/i
			],
			post: {
				'user.usrname': 'Joe',
				password: 'Mama',
				score: 0,
				complexity: 0
			}
		},
		{
			name: 'Website Self-Signed',
			url: 'https://localhost:8443/path?query=1&sort=descending',
			sampleRate: 15, // in seconds
			maxResponseTime: 20, // in seconds
			patterns: [
				/exception/i
			],
			httpOptions: {
				ca: [fs.readFileSync('caCert.pem')] // returns contents of the file
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
					// make facebook think this request is coming from a browser so it will serve the correct page
					// otherwise facebook serves a blank page
					'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.1916.153 Safari/537.36'
				}
			}
		}
	]
};