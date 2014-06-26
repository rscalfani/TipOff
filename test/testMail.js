var nodemailer = require('nodemailer');
// transport.sendMail(mailOptions, callback);
var transport = nodemailer.createTransport('SMTP', {
	host: 'mailtrap.io',
	port: 465,
	auth: {
		user: '21426859fad676806',
		pass: '01d93f1d839a96'
	}
});
var mailOptions = {
	from: 'rscalfani@gmail.com',
	to: 'rscalfani@gmail.com',
	subject: 'Test',
	text: 'This is a test'
};
transport.sendMail(mailOptions);