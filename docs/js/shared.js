/* exported allnames, isOverlay, isIgnored */
L.tileLayer.providerESP.eachLayer = function(callback) {
	for (var provider in providersESP) {
		if (providersESP[provider].variants) {
			for (var variant in providersESP[provider].variants) {
				if (providersESP[provider].variants[variant].deprecated) {
					continue;
				}
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
			if (providersESP[provider].variants[variant].deprecated) {
				continue;
			}
			allnames.push(provider + '.' + variant);
		}
	} else {
		allnames.push(provider);
	}
}
// Kept for the standalone development demos; the site uses map-app.js.
var isOverlay = function(providerName, layer) {
	return allnames.includes(providerName) && Boolean(layer.options.transparent || layer.options.opacity < 1);
};
var isIgnored = function(providerName) {
	return !allnames.includes(providerName);
};
