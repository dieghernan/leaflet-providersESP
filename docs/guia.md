---
layout: default
permalink: /guia/
title: Guía de uso
subtitle: De la primera capa a un mapa con varios proveedores
excerpt: Instalación, ejemplos y opciones de leaflet-providersESP.
---

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

## Ejemplos

### Un mapa completo

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

<div id="btndemo1" class="embed-responsive embed-responsive-4by3 my-2 chulapa-rounded-lg border border-primary">
  <iframe title="Ejemplo interactivo de Leaflet" class="embed-responsive-item" src="{{ '/demo/minimal/' | relative_url }}" allowfullscreen loading="lazy"></iframe>
</div>

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

<div id="btndemo2" class="embed-responsive embed-responsive-4by3 my-2 chulapa-rounded-lg border border-primary">
  <iframe title="Ejemplo interactivo de Leaflet" class="embed-responsive-item" src="{{ '/demo/overlays/' | relative_url }}" allowfullscreen loading="lazy"></iframe>
</div>

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

<div id="btndemo3" class="embed-responsive embed-responsive-4by3 my-2 chulapa-rounded-lg border border-primary">
  <iframe title="Ejemplo interactivo de Leaflet" class="embed-responsive-item" src="{{ '/demo/leafletproviders/' | relative_url }}" allowfullscreen loading="lazy"></iframe>
</div>

## Elegir una capa

Cada capa se identifica con `Proveedor.Variante`, por ejemplo `IGNBase.Gris`.
Si omites la variante se usa la predeterminada del proveedor: `IGNBase` y
`IGNBase.Todo` muestran la misma cartografía, aunque cada llamada crea un objeto
Leaflet distinto.

Busca una capa en el [catálogo]({{ '/preview/' | relative_url }}), comprueba su
aspecto y copia su llamada a `L.tileLayer.providerESP()`.

## Fondos, superposiciones y opciones

Un fondo aporta la cartografía principal. Las superposiciones añaden información
sobre él, como límites administrativos o curvas de nivel. Algunas capas solo
muestran información a partir de un nivel de zoom o dentro de su cobertura.

Puedes pasar opciones de Leaflet como segundo argumento:

```js
L.tileLayer.providerESP('UnidadesAdm.Limites', {
    opacity: 0.7
}).addTo(map);
```

El [visor]({{ '/visor/' | relative_url }}) permite combinar un fondo con varias
superposiciones y ajustar su opacidad. La clasificación del catálogo se deduce
de las opciones de transparencia y opacidad del proveedor.

En **Explorar**, busca y selecciona una capa. Pulsa **Usar como fondo** o
**Añadir al mapa** para mostrarla. Seleccionar un resultado permite consultar su
código sin cambiar las capas que ya estás viendo.

La pestaña **En el mapa** permite mostrar u ocultar capas, ajustar su opacidad,
cambiar el orden de las superposiciones y quitarlas. Los enlaces compartidos
conservan estos ajustes y la posición del mapa.

La franja superior ofrece **Con plugin** y **Sin plugin**. **Expandir** muestra el
código completo de la capa seleccionada; **Copiar** copia el formato elegido.
En móvil, abre el panel con **Capas** o consulta el código con **Código** en la
barra inferior. El panel se cierra al añadir una capa para volver al mapa.

El botón de la esquina superior derecha amplía el visor a pantalla completa.
Puedes salir con el mismo botón o con Escape. Si alguna capa no carga, pulsa
**Reintentar carga**. Al quitar una capa, **Deshacer** recupera su visibilidad,
opacidad y posición entre las superposiciones.

## Compatibilidad y cambios de nombres

La API de este plugin es `L.tileLayer.providerESP()`. La de **leaflet-providers**
es `L.tileLayer.provider()`. Puedes usar ambas en el mismo mapa; no necesitas
cargar **leaflet-providers** si solo usas las capas de este proyecto.

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

## Si el mapa no se ve

- Comprueba que el contenedor tiene altura y que cargas el CSS de Leaflet.
- Carga el JavaScript de Leaflet antes del plugin y crea el mapa después del
  contenedor HTML.
- Acércate a la zona de cobertura: una capa puede no tener datos en todo el
  territorio o a todas las escalas.
- Consulta la consola y la pestaña de red del navegador. Una petición fallida
  puede deberse al servicio remoto, a sus condiciones de acceso o a CORS.
- Si una capa transparente parece vacía, añade un fondo y comprueba su zoom
  mínimo en el catálogo.

## Atribución y condiciones de uso

Mantén visible el control de atribución de Leaflet. El plugin incorpora la
atribución configurada para cada capa, pero debes consultar las condiciones del
organismo antes de reutilizar sus mapas. La licencia MIT del código no sustituye
las condiciones de los servicios cartográficos.

La presencia de una capa en el catálogo no garantiza su disponibilidad. Consulta
las [incidencias conocidas](https://github.com/dieghernan/leaflet-providersESP/blob/main/CHANGELOG.md)
y la [auditoría de servicios](https://github.com/dieghernan/leaflet-providersESP/blob/main/dev/capabilities-audit.md)
para conocer las comprobaciones realizadas y sus fechas.
