---
layout: default
title: Leaflet-providersESP
subtitle: Plugin para Leaflet con información de organismos españoles
header_type: hero
---

**Leaflet-providersESP** es un plugin para mapas [Leaflet](https://leafletjs.com/) que proporciona un acceso fácil a diferentes servicios web de mapas (WMS) y servicios web de mapas teselados (WMTS) proporcionados por organismos públicos de España, como el Instituto Geográfico Nacional ([IGN](https://www.ign.es/web/ign/portal/ide-area-nodo-ide-ign)) o el servicio de Infraestructura de Datos Espaciales de España ([IDEE](https://www.idee.es/directorio-de-servicios)) del Consejo Superior Geográfico.


Este plugin es compatible con el plugin [leaflet-providers](https://github.com/leaflet-extras/leaflet-providers)

## Instalación 

### Via CDN

```html
<!-- Last version -->
<script src="https://cdn.jsdelivr.net/gh/dieghernan/leaflet-providersESP/dist/leaflet-providersESP.min.js"></script>

<!-- Specific release -->
<script src="https://cdn.jsdelivr.net/gh/dieghernan/leaflet-providersESP@version/dist/leaflet-providersESP.min.js"></script>
```

### Local

Get [leaflet-providersESP.js](https://github.com/dieghernan/leaflet-providersESP/tree/master/dist):

```html
<!-- Last version -->
<script src="./path/to/your/folder/leaflet-providersESP.js"></script>
```

## Demos

### Full page
```html
<!DOCTYPE html>
<html>
<head>
	<title>Minimal page | leaflet-providersESP</title>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<!-- Load Leaflet -->
	<link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
	<script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
	<!-- Install leaflet-providersESP -->
	<script src="https://cdn.jsdelivr.net/gh/dieghernan/leaflet-providersESP/dist/leaflet-providersESP.min.js"></script>
	<!-- Display map full page -->
	<style>
	html {
		height: 100%
	}
	body {
		height: 100%;
		margin: 0;
		padding: 0;
	}
	#mapid {
		height: 100%;
		width: 100%
	}
	</style>
</head>
<body>
	<!-- Create map -->
	<div id="mapid"></div>
	<!-- Puerta del Sol - IDErioja server -->
	<script>
	var mymap = L.map('mapid').setView([40.4166, -3.7038400], 18);
	L.tileLayer.providerESP('IDErioja').addTo(mymap);
	</script>
</body>
```

<div class="embed-responsive embed-responsive-21by9 my-2 chulapa-rounded-lg border border-primary">
  <iframe class="embed-responsive-item" src="./demo/minimal" allowfullscreen></iframe>
</div>

### Varias capas

Pico del Mulhacén

```html
<div id="map"></div>
<script>
  var map2 = L.map('map', {center: [37.053333,-3.311389],zoom: 15});
			L.tileLayer.providerESP('MDT.Relieve').addTo(map2);
			L.tileLayer.providerESP('MDT.CurvasNivel').addTo(map2);
			L.tileLayer.providerESP('NombresGeograficos').addTo(map2);
</script>
```

<div class="embed-responsive embed-responsive-21by9 my-2 chulapa-rounded-lg border border-primary">
  <iframe class="embed-responsive-item" src="./demo/overlays" allowfullscreen></iframe>
</div>


### leaflet-providersESP + leaflet-providers

Masas de agua + CartoDB

```html
<div id="map"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet-providers/1.10.2/leaflet-providers.min.js"></script>
<script>
  var map3 = L.map('map',{center: [40,-4],zoom: 6});
  var base = {'CartoDB': L.tileLayer.provider('CartoDB.PositronNoLabels').addTo(map3)};
  var over ={'Masas de agua': L.tileLayer.providerESP('Hidrografia.MasaAgua',{transparent: true}).addTo(map3)};
  L.control.layers(base, over, {collapsed: false}).addTo(map3);
</script>
```

<div class="embed-responsive embed-responsive-21by9 my-2 chulapa-rounded-lg border border-primary">
  <iframe class="embed-responsive-item" src="./demo/leafletproviders" allowfullscreen></iframe>
</div>

## Proveedores disponibles


<p id="pr"></p>
