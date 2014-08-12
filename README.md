#TipOff
TipOff is a program that monitors websites and notifies you when they go down by emailing a Down Report. It creates detailed logs that include errors, website uptimes/downtimes, and operational statistics.

The following features are supported:

* Monitoring websites via HTTP/HTTPS
* POST & GET requests
* Multiple checks per website
* Response pattern matching
* API for deployment via HTTP/HTTPS
* Nag Report emails for extended website downtimes
* Monitoring websites with self-signed certificates

#Installation
```javascript
npm install -g tipoff
```

#Execution
TipOff is started on the command line by running `node /usr/local/lib/node_modules/tipoff/app.js` OR `node /usr/local/lib/node_modules/tipoff/server.js`, which uses [forever-monitor][idForeverMonitor] to run TipOff continously (aka forever).

[idForeverMonitor]: https://github.com/nodejitsu/forever-monitor

#Config Files
There are 5 config files: monitorConfig, notifierConfig, apiConfig, config, & loggingConfig.  

1\. **monitorConfig** is the config file of the monitoring function in which the following are specified in the defaults and/or in an array of monitored websites:

* `name` is the name of the website being monitored.
	
* `url` is the url of the website being monitored.
	
* `sampleRate` is the rate in seconds that the website will be monitored. For example, a value of 30 means that the website will be checked every 30 seconds.
	
* `maxResponseTime`is the amount of time in seconds that if the website has not responded by, it is considered down and a timeout error will be logged.
	
* `patterns` are regular expressions that if the website's response matches, it is considered down and a bad patterns error will be logged.
	
* `post`is the form data that will be posted.
	
* `httpOptions` are additional http request options. The most useful ones are `ca` and `headers`. Most of the options will be supplied by TipOff based on the website url.
	
	* *I suggest reading the [Node.js documentation][idNodeJs] to better understand how to configure `httpOptions`.*
		
[idNodeJs]: http://nodejs.org/api/http.html#http_http_request_options_callback

2\. **notifierConfig** is the config file of the notification function in which the following are specified:

* `intervalTimerFreq` is the frequency in seconds that Down Reports will be sent. A new Down Report will be sent if at least one of the websites is still down and the up/down status of a website has changed.
	
	* A Down Report is an email that contains which websites are down and what has changed since the last Down Report was sent.
			
	* An Up Report will be sent when all of the websites come back up.
		
* `nagIntervalTimerFreq` is the frequency in seconds that Nag Reports will be sent as a reminder if none of the website statuses have changed.
	
	* A Nag Report is identical to the last sent Down Report
	<p/>	
* `transport` is used to send emails via Nodemailer. `host`, `port`, & `auth` OR `service` and `auth` must be specified.
	
	* *I suggest reading the [Nodemailer documentation][idNodemailer] to better understand how to configure `transport`.*
		
[idNodemailer]: https://github.com/andris9/Nodemailer  
	<p/>
* `mailOptions` only requires `from` and `to`. Do not specify `subject` or `text`. They will be supplied by TipOff at runtime.
	
3\. **apiConfig** is the config file of the API web server in which `port` & `options` are specified.

* If no `options` are specified, an http server will be created. At least `key` & `cert` must be specified in `options` to create an https server (`ca` can be added if you want to use a self-signed certificate).

4\. **config** is the main config file in which the following is specified:

* `statsFreq` is the frequency in seconds that the operational statistics will be logged.

5\. **loggingConfig** is the config file of the loggers, which were created with log4js.

* A file appender and an Error Report can be configured (see the corresponding example below).

* *I suggest reading the configuration section of the [log4js documentation][idLog4js] to better understand how to configure loggingConfig.*

[idLog4js]: https://github.com/nomiddlename/log4js-node

#Config Examples
1\. **monitorConfig** example:

```javascript
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
				user: 'Joe',
				password: 'Mama'
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
```  

2\. **notifierConfig** example:

```javascript
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
```

3\. **apiConfig** example:

```javascript
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
```  

4\. **config** example:

```javascript
module.exports = {
	statsFreq: 0.25 * 60 // in seconds
};
```  

5\. **loggingConfig** example:

```javascript
module.exports = {
	appenders: [
		{
			// writes all logs to a log file
			type: 'file',
			filename: '/tmp/test.log', // path to log file
			maxLogSize: 20 * 1024 * 1024,
			backups: 3
		},
		{
			// will only send emails for errors
			type: 'logLevelFilter',
			level: 'ERROR',
			appender: {
				type: 'smtp',
				sender: 'yourself@gmail.com',
				recipients: ['yourself@gmail.com', 'someone@gmail.com'],
				subject: 'TipOff: Error Report',
				transport: {
					service: 'gmail',
					auth: {
						user: 'yourself@gmail.com',
						pass: 'password'
					}
				}
			}
		}
	]
};
```

#API
Two requests are supported by the API: `startGrace` and `stopGrace`. A client must give the API an HTTP or HTTPS GET request to start or stop a grace period.  

* A grace period is the amount of time in minutes that TipOff stops monitoring a specified website so that reports will not be sent even if it goes down. This is useful during website redeployment.

##startGrace
The following URL starts a grace period for **myWebsite** for a period of **5** minutes:

* `https://localhost:8443/startGrace?website=myWebsite&period=5`

This example assumes that the API is an HTTPS server i.e. `options` were specified in the apiConfig and that TipOff is running on the local machine on port 8443.

##stopGrace
The following URL stops a grace period for **myWebsite**:

* `http://localhost:8080/stopGrace?website=myWebsite`

This example assumes that the API is an HTTP server i.e. no `options` were specified in the apiConfig and that TipOff is running on the local machine on port 8080.

#Contact

Send comments and questions to <rscalfani@gmail.com>.