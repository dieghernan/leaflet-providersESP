---
layout: default
title: Leaflet-providersESP
seo_title: "Leaflet-providersESP: mapas de España para Leaflet"
subtitle: Cartografía pública de España para tus mapas Leaflet
description: Mapas base, ortofotos y capas WMS y WMTS de organismos públicos de España para Leaflet. Explora proveedores y copia el código para tu mapa.
header_type: hero
excerpt: Explora mapas base, ortofotos y capas temáticas de organismos públicos y añádelos a Leaflet con una línea de código.
---

**Leaflet-providersESP** reúne configuraciones de servicios WMS y WMTS de
organismos públicos como el IGN, el CNIG o Catastro. Elige una capa por su nombre
y añádela a tu mapa Leaflet.

<div class="row my-4">
  <div class="col-md-4 mb-3"><a class="btn btn-primary btn-block" href="{{ '/guia/' | relative_url }}">Empezar con Leaflet</a></div>
  <div class="col-md-4 mb-3"><a class="btn btn-outline-primary btn-block" href="{{ '/preview/' | relative_url }}">Explorar las capas</a></div>
  <div class="col-md-4 mb-3"><a class="btn btn-outline-primary btn-block" href="{{ '/visor/' | relative_url }}">Abrir el visor</a></div>
</div>

## Una capa, una línea

Una vez cargados Leaflet y el plugin, basta con indicar el proveedor:

```js
L.tileLayer.providerESP('IGNBase.Todo').addTo(map);
```

![Mapa de España con cartografía de los proveedores incluidos]({{ '/assets/example.jpg' | relative_url }})

La [guía de uso]({{ '/guia/' | relative_url }}) incluye la instalación y un
HTML completo que puedes guardar y abrir en el navegador. El plugin funciona
con Leaflet y se puede combinar con **leaflet-providers**.

## Encuentra la cartografía que necesitas

- **Mapas base y ortofotos**: empieza por `IGNBase` o `PNOA`.
- **Relieve**: explora `LiDAR` y las variantes de `MDT`.
- **Información temática**: superpone límites administrativos, hidrografía,
  transporte o información geofísica.

En el [catálogo]({{ '/preview/' | relative_url }}) puedes buscar por nombre,
filtrar por servicio y copiar el código. En el
[visor]({{ '/visor/' | relative_url }}) puedes combinar capas, ajustar la
opacidad y compartir una vista.

<a id="proveedores-disponibles"></a>
## Proveedores disponibles

El [catálogo interactivo]({{ '/preview/' | relative_url }}) se genera a partir
de las definiciones del plugin. Incluye los nombres de las variantes, sus
servicios y las atribuciones configuradas.

La cobertura y la disponibilidad dependen de cada organismo. Algunas capas solo
se muestran a determinadas escalas. Consulta las condiciones del proveedor y
mantén visible la atribución. La licencia MIT del plugin se aplica al código.

## Colabora

¿Has encontrado una capa que falla o quieres proponer otra?
[Abre una incidencia](https://github.com/dieghernan/leaflet-providersESP/issues)
con el nombre de la capa, la zona y el nivel de zoom. Consulta también la
[guía para contribuir](https://github.com/dieghernan/leaflet-providersESP/blob/main/CONTRIBUTING.md),
los [cambios de versión](https://github.com/dieghernan/leaflet-providersESP/blob/main/CHANGELOG.md)
y la [auditoría de servicios](https://github.com/dieghernan/leaflet-providersESP/blob/main/dev/capabilities-audit.md).
