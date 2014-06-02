var monitorConfig = require('./monitorConfig');
var monitor = require('./monitor');

monitor.init(monitorConfig);
monitor.start();