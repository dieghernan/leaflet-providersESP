---
layout: default
title: Leaflet-providersESP
subtitle: Plugin para Leaflet con información de organismos españoles
header_type: hero
excerpt: 'Leaflet-providersESP es un plugin para mapas Leaflet que proporciona un acceso fácil a diferentes servicios web de mapas (WMS) y servicios web de mapas teselados (WMTS) proporcionados por organismos públicos de España, como el Instituto Geográfico Nacional (IGN) o el servicio de Infraestructura de Datos Espaciales de España (IDEE) del Consejo Superior Geográfico.'
---

<div markdown="1" class="badges">
![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/dieghernan/leaflet-providersESP)
[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.5731395.svg)](https://doi.org/10.5281/zenodo.5731395)
[![CodeQL](https://github.com/dieghernan/leaflet-providersESP/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/dieghernan/leaflet-providersESP/actions/workflows/codeql-analysis.yml)
[![CodeFactor](https://www.codefactor.io/repository/github/dieghernan/leaflet-providersesp/badge)](https://www.codefactor.io/repository/github/dieghernan/leaflet-providersesp)
![jsDelivr hits (GitHub)](https://img.shields.io/jsdelivr/gh/hy/dieghernan/leaflet-providersESP)
[![ko-fi](https://img.shields.io/badge/buy%20me%20a%20coffee-donate-yellow.svg)](https://ko-fi.com/dieghernan)
</div>

**Leaflet-providersESP** es un plugin para mapas [Leaflet](https://leafletjs.com/) que proporciona un acceso fácil a diferentes servicios web de mapas (WMS) y servicios web de mapas teselados (WMTS) proporcionados por organismos públicos de España, como el Instituto Geográfico Nacional ([IGN](https://www.ign.es/web/ign/portal/ide-area-nodo-ide-ign)) o el servicio de Infraestructura de Datos Espaciales de España ([IDEE](https://www.idee.es/directorio-de-servicios)) del Consejo Superior Geográfico.


Este plugin es compatible con el plugin [leaflet-providers](https://github.com/leaflet-extras/leaflet-providers).


* TOC
{:toc}



## Instalación

Carga primero el CSS y el JavaScript de Leaflet y después leaflet-providersESP.
El plugin funciona directamente con Leaflet; cargar leaflet-providers es opcional.

### Vía CDN

Para usar la versión publicada `v1.4.0` con Leaflet `1.9.4`:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css">
<script src="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://cdn.jsdelivr.net/gh/dieghernan/leaflet-providersESP@v1.4.0/dist/leaflet-providersESP.min.js"></script>
```

Para seguir el desarrollo en `main`, sustituye solo el script del plugin por:

```html
<script src="https://cdn.jsdelivr.net/gh/dieghernan/leaflet-providersESP@main/dist/leaflet-providersESP.min.js"></script>
```

La URL de `main` sigue esa rama y puede cambiar. Para probar los cambios sin
publicar de tu copia del repositorio, usa los archivos locales.

### Local

Copia `dist/leaflet-providersESP.min.js` junto a tu archivo HTML y sustituye el
script del plugin en el ejemplo completo de abajo por:

```html
<script src="./leaflet-providersESP.min.js"></script>
```

También puedes copiar `dist/leaflet-providersESP.js` y usar
`src="./leaflet-providersESP.js"` para cargar el código sin minificar. Los archivos
están en [dist/](https://github.com/dieghernan/leaflet-providersESP/tree/main/dist).
Mantén las referencias al CSS y al JavaScript de Leaflet antes del plugin.

## Demos

### Página completa

Guarda este ejemplo como `index.html` y ábrelo en el navegador. El contenedor del
mapa necesita una altura explícita para ser visible.

```html
<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Mapa de España</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css">
    <script src="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://cdn.jsdelivr.net/gh/dieghernan/leaflet-providersESP@v1.4.0/dist/leaflet-providersESP.min.js"></script>
    <style>
        html, body { height: 100%; margin: 0; }
        #map { height: 100%; width: 100%; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
var map = L.map('map').setView([40.4166, -3.7038], 12);
L.tileLayer.providerESP('IGNBase.Todo').addTo(map);
    </script>
</body>
</html>
```

<div class="embed-responsive embed-responsive-4by3 my-2 chulapa-rounded-lg border border-primary">
  <iframe class="embed-responsive-item" src="./demo/minimal" allowfullscreen loading="lazy"></iframe>
</div>


<a id="btndemo1" class="btn btn-block btn-primary btn-sm" href="./demo/minimal" role="button">Full screen</a>


### Varias capas

Los siguientes fragmentos sustituyen el contenedor y el script del mapa del
ejemplo completo. Conserva los estilos y las dependencias del `<head>`.

```html
<div id="map"></div>
<script>
var map2 = L.map('map', { center: [37.053333, -3.311389],
	zoom: 15 });
L.tileLayer.providerESP('LiDAR').addTo(map2);
L.tileLayer.providerESP('MDT.CurvasNivel').addTo(map2);
L.tileLayer.providerESP('NombresGeograficos').addTo(map2);
</script>
```

<div class="embed-responsive embed-responsive-4by3 my-2 chulapa-rounded-lg border border-primary">
  <iframe class="embed-responsive-item" src="./demo/overlays" allowfullscreen loading="lazy"></iframe>
</div>

<a id="btndemo2" class="btn btn-block btn-primary btn-sm" href="./demo/overlays" role="button">Full screen</a>


### leaflet-providersESP + leaflet-providers

```html
<div id="map"></div>
  <script src="https://cdn.jsdelivr.net/npm/leaflet-providers@4.0.0/leaflet-providers.js"></script>
<script>
var map3 = L.map('map', { center: [38.8, -5.3],
	zoom: 5 });
var base = { 'OpenStreetMap.Mapnik': L.tileLayer.provider('OpenStreetMap.Mapnik').addTo(map3),
	'Esri.WorldTopoMap': L.tileLayer.provider('Esri.WorldTopoMap') };
var over = { 'Terremotos Ult. 30dias': L.tileLayer.providerESP('Geofisica.Terremotos30dias', { transparent: true }).addTo(map3) };
L.control.layers(base, over, { collapsed: false }).addTo(map3);
</script>
```

<div class="embed-responsive embed-responsive-4by3 my-2 chulapa-rounded-lg border border-primary">
  <iframe class="embed-responsive-item" src="./demo/leafletproviders" allowfullscreen loading="lazy"></iframe>
</div>


<a id="btndemo3" class="btn btn-block btn-primary btn-sm" href="./demo/leafletproviders" role="button">Full screen</a>



## Proveedores disponibles

### Nombres de variantes y deprecaciones

Desde la versión 1.4.0, los nombres recomendados son
`CaminoDeSantiago.CaminosNordeste` y `Geofisica.HazardArea2002` (mapa NCSE-02 de
2002). Los nombres anteriores, `CaminoDeSantiago.CaminosCatalanes` y
`Geofisica.HazardArea`, siguen funcionando como alias de las mismas capas.

Las demás variantes de `Copernicus` usan los servicios oficiales de EEA y conservan
sus nombres y los productos de 2012/2015. La cobertura sigue los productos europeos.
`ForestLeaf` solicita EPSG:4326 automáticamente, también en el mapa Mercator
predeterminado de Leaflet. Las otras variantes usan EPSG:3857. Las peticiones
combinan las resoluciones o las capas ráster y vectoriales disponibles para que el
servicio seleccione la representación adecuada según la escala.

`Copernicus.RiparianGreen` está deprecada: el servicio no está disponible y no se
ha identificado un WMS oficial equivalente. La llamada sigue admitida por
compatibilidad y muestra un aviso en la consola una vez por página. Esta variante
ya no se incluye en las listas de capas disponibles ni en las previsualizaciones.

**View all: [Preview](https://dieghernan.github.io/leaflet-providersESP/preview/)**
{: .lead}

<p id="pr"></p>

<script src="./js/shared.js"></script>
<script>
  // Add it to the page
  nprovs = document.getElementById('pr');
  nprovs.innerHTML = '<strong class="lead">'
+ allnames.length + '</strong> capas disponibles:';
</script>

<table>
  <thead>
    <tr>
      <th>Proveedor</th>
      <th>Capas</th>
    </tr>
  </thead>
  <tbody id="listprov">
  </tbody>
</table>

*Nota*: En aquellos proveedores con varias capas, la llamada a `PROVEEDOR`  equivale a `PROVEEDOR.PRIMERA_CAPA`:

```js
L.tileLayer.providerESP('IGNBase') === L.tileLayer.providerESP('IGNBase.Todo')

```

<script>
  for (var provider in providersESP) {
    if (providersESP[provider].variants) {
      var allnames = [];
      for (var variant in providersESP[provider].variants) {
        if (providersESP[provider].variants[variant].deprecated) {
          continue;
        }
        allnames.push('<code>' + variant +'</code>');
      }
    } else {		
      allnames = [];
    }
    row = document.createElement('tr');
    row.innerHTML = '<td><code>' +
    provider + '</code></td><td>'
    + allnames.join(', ') +'</td>';
    document.getElementById('listprov').appendChild(row);
  }
</script>

## Colabora

Este proyecto es Open Source. Si deseas colaborar puedes abrir un issue o enviar un PR. 
