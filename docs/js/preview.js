var map = L.map('map', {
	center: [40.4166, -3.7038400],
	zoomControl: false,
	zoom: 7
});
function escapeHtml(string) {
	return string
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}
function renderValue(value) {
	if (typeof value === 'string') {
		return "'" + escapeHtml(value) + "'";
	} else {
		return JSON.stringify(value).replace(/,/g, ', ');
	}
}
function getExampleJS(name) {
	var prov = LPESP_composenames(name);
	var layerName = name.replace('.', '_');
	var url = prov.url;
	var options = L.extend({}, prov.options || {});
	delete options.providerName;
	// replace {variant} in urls with the selected variant, since
	// keeping it in the options map doesn't make sense for one layer
	if (options.variant) {
		url = url.replace('{variant}', options.variant);
		delete options.variant;
	}
	var url2 = url;
	for (var option in options) {
		var templ = '{' + option + '}';
		if (url2.includes(templ)) {
			url2 = url2.replace(templ, options[option]);
			delete options[option];
		}
	}
	var call = '';
	if (url2.includes("{x}")) {
		call = ' = L.tileLayer(\'';
	} else {
		call = ' = L.tileLayer.wms(\'';
	}
	var code = 'var ' + layerName + call + url2 + '\', \n\t{\n';
	var first = true;
	for (var optionfinal in options) {
		if (first) {
			first = false;
			code += '\t   ' + optionfinal + ': ' + renderValue(options[optionfinal]);
		} else {
			code += ',\n';
			code += '\t   ' + optionfinal + ': ' + renderValue(options[optionfinal]);
		}
	}
	code += '\n\t});\n';
	return code;
}
// collect all layers available in the provider definition
var baseLayers = {};
var overlays = {};
var addLayer = function(name) {
	if (isIgnored(name)) {
		return;
	}
	var layer = L.tileLayer.providerESP(name);
	if (isOverlay(name, layer)) {
		overlays[name] = layer;
	} else {
		baseLayers[name] = layer;
	}
};
L.tileLayer.providerESP.eachLayer(addLayer);
// add minimap control to the map
var layersControl = L.control.layers.minimap(baseLayers, overlays, {
	collapsed: false
}).addTo(map);

// Pass a filter in the hash tag to show only layers containing that string
// for example: #filter=Open
/*
var filterLayersControl = function() {
	var hash = window.location.hash;
	var filterIndex = hash.indexOf('filter=');
	if (filterIndex !== -1) {
		var filterString = hash.substr(filterIndex + 7).trim();
		var visible = layersControl.filter(filterString);
		console.log(visible);
		// enable first layer as actual layer.
		var first = Object.keys(visible)[0];
		if (first in baseLayers) {
			map.addLayer(baseLayers[first]);
			map.eachLayer(function(layer) {
				if (layer.options.transparent !== first) {
					map.removeLayer(layer);
				}
			});
		}
	}
};
L.DomEvent.on(window, 'hashchange', filterLayersControl);
*/
baseLayers[Object.keys(baseLayers)[0]].addTo(map);

map.addControl(new(L.Control.extend({
	options: {
		position: 'topleft'
	},
	onAdd: function(map) {
		var container = L.DomUtil.get('info');
		L.DomEvent.disableClickPropagation(container);
		L.DomUtil.create('h6','font-weight-bold' , container).innerHTML = 'Proveedores disponibles en <code>leaflet-providersESP.js</code>';
		var providerNames = L.DomUtil.create('code', 'provider', container);
		L.DomUtil.create('h6', 'font-weight-bold', container).innerHTML = 'JavaScript:';
		var pre = L.DomUtil.create('pre', null, container);
		var code = L.DomUtil.create('code', 'javascript', pre);
		var update = function(event) {
			code.innerHTML = '';
			var names = [];
			// loop over the layers in the map and add the JS
			for (var key in map._layers) {
				var layer = map._layers[key];
				// do not add the layer currently being removed
				if (event && event.type === 'layerremove' && layer === event.layer) {
					continue;
				}
				names.push(L.Util.template('<a href="#filter={name}">{name}</a>', {
					name: layer.options.providerName
				}));
				code.innerHTML += getExampleJS(layer.options.providerName);
			}
			providerNames.innerHTML = names.join(', ');
			/* global hljs:true */
			hljs.highlightBlock(code);
		};
		map.on({
			'layeradd': update,
			'layerremove': update
		});
		update();
		return container;
	},
})));


