var fs = require('fs'); // filesystem

module.exports = {
	port: 8080,
	options: {
		// fs.readFileSync returns contents of the file
		//		key: fs.readFileSync('serverPrivateKey.pem'),
		//		cert: fs.readFileSync('serverCert.pem'),
		//		ca: fs.readFileSync('caCert.pem')
	}
};