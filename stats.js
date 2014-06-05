module.exports = function(moduleOrder, logger, logFreq) {
	var private = {
		loggingId: null,
		monitorCounters: {}, // moduleName: countersDef
		formatCounters: function() {

		}
	};
	var stats = {
		registerCounters: function(moduleName, countersDef) {
			// saves countersDef for specified module
			private.monitorCounters[moduleName] = countersDef;
			// add and initialize counters
			Object.keys(countersDef).forEach(function(counterName) {
				countersDef[counterName].counter = 0;
			});
			var countersDef = private.monitorCounters[moduleName];
			return {
				increment: function(counterName){
					++countersDef[counterName].counter;
				},
				reset: function(counterName){
					countersDef[counterName].counter = 0;
				}
			};
		},
		startLogging: function() {
			if (!private.loggingId)
			{
				private.loggingId = setInterval(function(){
					logger.info(private.monitorCounters);
				}, logFreq * 1000);
			}
		},
		stopLogging:function() {
			if (private.loggingId)
				clearInterval(private.loggingId);
			private.loggingId = null;
		}
	};
	return stats;
};