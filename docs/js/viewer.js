var map = L.map('map', {
	center: [40.4166, -3.7038400],
	zoomControl: true,
	zoom: 5
});

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
var layersControl = L.control.layers(baseLayers, overlays, {
	collapsed: true
}).addTo(map);

baseLayers[Object.keys(baseLayers)[0]].addTo(map);

map.locate({setView: true, maxZoom: 16});

function onLocationFound(e) {
    var radius = e.accuracy*2;
}

map.on('locationfound', onLocationFound);

function onLocationError(e) {
    alert(e.message);
}

map.on('locationerror', onLocationError);

L.easyButton('fa-crosshairs', function(){
    map.locate({setView: true, maxZoom: 16});
    map.on('locationfound', onLocationFound);
    
}).addTo(map);

	L.easyButton('fa-square-o', function(){
    map.setView([40,-3],5);
}).addTo(map);

L.easyButton('<span>C</span>', function(){
    map.setView([28, -15.8],6);
}).addTo(map);
L.easyButton('fa-globe', function(){
    map.setView([40,-3],2);
}).addTo(map);



        // Control 3: This add a Search bar
            var searchControl = new L.esri.Controls.Geosearch().addTo(map);

            var results = new L.LayerGroup().addTo(map);

              searchControl.on('results', function(data){
                results.clearLayers();
                for (var i = data.results.length - 1; i >= 0; i--) {
                  results.addLayer(L.marker(data.results[i].latlng));
                }
              });
