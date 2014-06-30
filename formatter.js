module.exports = function() {
	var formatter = {
		getLongestLength: function(list) {
			var longestLength = 0;
			list.forEach(function(item) {
				if (item && item.length > longestLength)
					longestLength = item.length;
			});
			return longestLength;
		},
		padRight: function(str, length, pad) {
			str = str || '';
			str = String(str);
			pad = pad || ' ';
			var numberOfSpaces = length - str.length;
			for (var i = 0; i < numberOfSpaces; ++i)
				str = str + pad;
			return str;
		},
		padLeft: function(str, length, pad) {
			str = str || '';
			str = String(str);
			pad = pad || ' ';
			var numberOfSpaces = length - str.length;
			for (var i = 0; i < numberOfSpaces; ++i)
				str = pad + str;
			return str;
		},
		createBuffer: function(length) {
			// hack to convert an empty array to one with undefined values so we can use map
			// ex: Array(3) --> [ , , ]
			// ex: Array.apply(null, Array(3)) --> [undefined, undefined, undefined]
			return Array.apply(null, Array(length)).map(function() {
				return '';
			});
		},
		addRepeatingColumn: function(buffer, column) {
			buffer.forEach(function(item, index) {
				buffer[index] += column;
			});
		},
		addColumnToBuffer: function(buffer, column, columnPad, padFunc) {
			var longestLength = formatter.getLongestLength(column) + columnPad;
			column.forEach(function(item, index) {
				buffer[index] += padFunc(item, longestLength);
			});
		}
	};
	return formatter;
};