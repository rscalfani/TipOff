#!/usr/bin/env node
// previous line to tell the shell to pass this file to node

var _ = require('underscore');
var fs = require('fs');
var http = require('http');
var https = require('https');
var url = require('url');
var argv = require('optimist')
	.usage('Usage:\n$0 --start --url <tipOffUrl> --website <websiteName> --period <gracePeriodMins> [--ca <caCertificatePath>]\n' +
		   '$0 --stop --url <tipOffUrl> --website <websiteName> [--ca <caCertificatePath>]')
	.boolean('start')
	.boolean('stop')
	.string('url')
	.string('website')
	.string('ca')
	.demand(['url', 'website'])
	.default('period', 1)
	.describe('url', 'protocol, server name, and port for TipOff server')
	.describe('website', 'website name from TipOff')
	.describe('period', 'grace period in minutes')
	.describe('ca', 'Certificate Authority certificate path')
	.argv;

var parseError = false;
if (argv.start && argv.stop)
{
	parseError = true;
	console.error('start and stop cannot both be specified');
}
else if (!argv.start && !argv.stop)
{
	parseError = true;
	console.error('either start or stop must be specified');
}
if (parseError)
	process.exit(1);

var queryOptions = '?website=' + argv.website;
if (argv.start)
	queryOptions += '&period=' + argv.period;

if (!_.isArray(argv.ca))
	argv.ca = [argv.ca];

var cas;
if(argv.ca)
{
	cas = argv.ca.map(function(ca) {
		return fs.readFileSync(ca);
	});
}

var urlParts = url.parse(argv.url);
var options = {
	host: urlParts.hostname,
	port: urlParts.port,
	path: '/' + (argv.start ? 'startgrace' : 'stopgrace') + queryOptions,
	method: 'GET',
	ca: cas
};

var result = '';
var req = (urlParts.protocol == 'http:' ? http.request : https.request)(options, function(res) {
	res.on('error', function(err) {
		console.error('Response Error:', err);
	});
	res.on('data', function(chunk) {
		result += chunk.toString();
	});
	res.on('end', function() {
		console.log(result);
	});
});

req.on('error', function(err) {
	console.error('Request Error:', err);
});
req.end();