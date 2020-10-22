L.tileLayer.providerESP.eachLayer = function (callback) {
	for (var provider in providersESP) {
		if (providersESP[provider].variants) {
			//callback(provider);
			for (var variant in providersESP[provider].variants) {
				callback(provider + '.' + variant);
			}
		} else {
			callback(provider);
		}
	}
};

var allnames = [];
for (var provider in providersESP) {
		if (providersESP[provider].variants) {
			for (var variant in providersESP[provider].variants) {
				allnames.push(provider + '.' + variant);
			}
		} else {
			allnames.push(provider);
		}
	}
if (!String.prototype.startsWith) {
	String.prototype.startsWith = function (searchString, position) {
		position = position || 0;
		return this.substr(position, searchString.length) === searchString;
	};
}

var isOverlay = function(providerName, layer) {
	if (layer.options.opacity && layer.options.opacity < 1) {
		return true;
	}
	if (layer.options.transparent) {
		return true;
	}
	var overlayPatterns = [
		'NA]'
	];
	return providerName.match('(' + overlayPatterns.join('|') + ')') !== null;
};
// Ignore some providers in the preview
var isIgnored = function(providerName) {
	if (providerName === 'ignored') {
		return true;
	}
	// reduce the number of layers previewed for some providers
	if (providerName.startsWith('HERE') || providerName.startsWith('OpenWeatherMap') || providerName.startsWith('MapBox') || providerName.startsWith('MapTiler')) {
		var whitelist = [
			// API threshold almost reached, disabling for now.
			// 'HERE.normalDay',
			'OpenWeatherMap.Clouds',
			'OpenWeatherMap.Pressure',
			'OpenWeatherMap.Wind'
		];
		return whitelist.indexOf(providerName) === -1;
	}
	return false;
};