---
layout: default
permalink: /capas/
title: Referencia de capas
subtitle: Qué representa cada capa y qué debes tener en cuenta al utilizarla
excerpt: Nombres, contenido y limitaciones de las capas de leaflet-providersESP, agrupadas por proveedor.
layer_reference: true
show_sidetoc: true
show_toc: false
---

Consulta aquí los nombres que acepta `L.tileLayer.providerESP()`, su contenido y
sus limitaciones. Para comparar imágenes y copiar código, abre
[Preview]({{ '/preview/' | relative_url }}). Para combinar capas, usa el
[visor]({{ '/visor/' | relative_url }}).

## Cómo leer esta referencia

- Los nombres sin variante seleccionan una capa predeterminada. Cuando dos nombres
  aparecen en la misma fila, representan la misma configuración.
- **Zoom mínimo** significa el mínimo configurado en el plugin. No garantiza que
  haya datos visibles en todo el territorio a esa escala. Si no se indica, el
  plugin no fija un mínimo específico para esa capa.
- **Zoom nativo 20** significa que el servicio WMTS proporciona teselas hasta ese
  nivel. Al ampliar más, Leaflet reutiliza esas teselas si la aplicación lo permite;
  no obtiene más detalle. Este límite no se aplica a las variantes WMS.
- Los rectángulos de cobertura configurados no describen la huella real de los
  datos. Una imagen vacía puede indicar falta de datos en esa zona o escala.
- Las capas son imágenes de servicios remotos: no descargan entidades vectoriales.
  Conserva la atribución y consulta las condiciones y metadatos de cada organismo.

Las observaciones de disponibilidad proceden de las comprobaciones del **27 y 28
de octubre de 2026**. No son una monitorización en tiempo real. Puedes consultar
la [auditoría de servicios](https://github.com/dieghernan/leaflet-providersESP/blob/main/dev/audit/capabilities-audit.md)
y las [comprobaciones de capas adicionales](https://github.com/dieghernan/leaflet-providersESP/blob/main/dev/audit/additional-layers-audit.md).

<div class="layer-reference" markdown="1">

## IDErioja

Cartografía de [IDErioja](https://www.iderioja.org/), servida como teselas XYZ.
Las variantes se comprobaron alrededor de Logroño. No debe suponerse que ofrecen
el mismo contenido o detalle fuera de La Rioja. No hay un documento OGC de
capacidades para este servicio.

| Nombre | Qué representa | Limitaciones o notas |
| --- | --- | --- |
| `IDErioja`, `IDErioja.Base` | Mapa base de IDErioja. | Predeterminado; detalle según la cobertura del servicio. |
| `IDErioja.Relieve` | Mapa base con representación del relieve. | Fondo cartográfico; no proporciona valores de elevación consultables. |
| `IDErioja.Claro` | Versión clara del mapa base. | Estilo de fondo para superponer información. |
| `IDErioja.Oscuro` | Versión oscura del mapa base. | Estilo cartográfico oscuro; no cambia el tema de la aplicación. |

## IGNBase

Mapa base del IGN. [Capacidades del servicio WMTS](https://www.ign.es/wmts/ign-base?service=WMTS&request=GetCapabilities).
Todas las variantes tienen **zoom nativo 20**.

| Nombre | Qué representa | Limitaciones o notas |
| --- | --- | --- |
| `IGNBase`, `IGNBase.Todo` | Mapa base completo del IGN. | Fondo predeterminado. |
| `IGNBase.Simplificado` | Callejero simplificado. | Reduce el contenido representado frente al mapa completo. |
| `IGNBase.Gris` | Mapa base en tonos grises. | Fondo neutro para combinar con capas temáticas. |
| `IGNBase.TodoNoFondo` | Contenido del mapa base sin su fondo cartográfico. | Zoom mínimo 4; conserva la configuración de imagen de este producto. |
| `IGNBase.Orto` | Cartografía del IGN preparada para acompañar ortofotografía. | Zoom mínimo 5; no sustituye a la ortofoto de PNOA. |

## MDT

Representaciones del terreno de IDEE/IGN. [WMTS](https://servicios.idee.es/wmts/mdt?service=WMTS&request=GetCapabilities)
y [WMS](https://servicios.idee.es/wms-inspire/mdt?service=WMS&request=GetCapabilities).
Las imágenes de elevación y relieve no son una descarga del modelo numérico.

| Nombre | Qué representa | Limitaciones o notas |
| --- | --- | --- |
| `MDT`, `MDT.Elevaciones` | Representación cartográfica de elevaciones. | WMTS; zoom nativo 20. |
| `MDT.Relieve` | Representación del relieve del terreno. | WMTS; zoom nativo 20. |
| `MDT.CurvasNivel` | Curvas de nivel. | WMS; zoom mínimo 12. |
| `MDT.SpotElevation` | Puntos de cota. | WMS; zoom mínimo 14. |

## PNOA

Ortofotografía del Plan Nacional de Ortofotografía Aérea.
[WMTS](https://www.ign.es/wmts/pnoa-ma?service=WMTS&request=GetCapabilities)
y [WMS](https://www.ign.es/wms-inspire/pnoa-ma?service=WMS&request=GetCapabilities).
«Máxima actualidad» no implica fotografía en tiempo real ni una fecha de vuelo
única para todas las zonas.

| Nombre | Qué representa | Limitaciones o notas |
| --- | --- | --- |
| `PNOA`, `PNOA.MaximaActualidad` | Ortofoto de máxima actualidad disponible en el servicio. | WMTS; zoom mínimo 4 y nativo 20. Fecha y resolución según la zona. |
| `PNOA.Mosaico` | Elementos del mosaico de ortofotografía. | WMS; zoom mínimo 4. No es la misma capa que la imagen continua de máxima actualidad. |

## OcupacionSuelo

Cartografía de ocupación y uso del suelo de IDEE.
[Capacidades WMTS](https://servicios.idee.es/wmts/ocupacion-suelo?service=WMTS&request=GetCapabilities).
Zoom nativo 20; las clases representadas dependen del producto y su fecha de referencia.

| Nombre | Qué representa | Limitaciones o notas |
| --- | --- | --- |
| `OcupacionSuelo`, `OcupacionSuelo.Ocupacion` | Cobertura u ocupación del suelo. | Describe la cobertura representada por el servicio, no su evolución en tiempo real. |
| `OcupacionSuelo.Usos` | Usos del suelo. | El uso y la cobertura son conceptos distintos; consulta la leyenda del producto. |

## LiDAR

[Servicio WMTS LiDAR](https://wmts-mapa-lidar.idee.es/lidar?service=WMTS&request=GetCapabilities).

| Nombre | Qué representa | Limitaciones o notas |
| --- | --- | --- |
| `LiDAR` | Visualización del modelo digital de superficie derivado de LiDAR. | Zoom nativo 20. Es una imagen cartográfica, no una nube de puntos ni una descarga de alturas. |

## MTN

[Mapa ráster del IGN](https://ign.es/wmts/mapa-raster?service=WMTS&request=GetCapabilities).

| Nombre | Qué representa | Limitaciones o notas |
| --- | --- | --- |
| `MTN` | Mapa Topográfico Nacional en formato ráster. | Zoom mínimo 4 y nativo 20. La escala y edición del mapa condicionan el detalle. |

## Geofisica

[Servicio WMS de geofísica del IGN](https://www.ign.es/wms-inspire/geofisica?service=WMS&request=GetCapabilities).
Las capas de eventos y las de peligrosidad representan conceptos diferentes.
Las primeras cambian con los datos del servicio; las segundas son productos de
referencia y no una predicción de un terremoto concreto.

| Nombre | Qué representa | Limitaciones o notas |
| --- | --- | --- |
| `Geofisica`, `Geofisica.Terremotos10dias` | Terremotos de los últimos 10 días. | Ventana temporal móvil; puede no haber eventos en la vista. |
| `Geofisica.Terremotos30dias` | Terremotos de los últimos 30 días. | Ventana temporal móvil. |
| `Geofisica.Terremotos365dias` | Terremotos de los últimos 365 días. | Ventana temporal móvil. |
| `Geofisica.ObservedEvents` | Eventos observados de la capa INSPIRE del servicio. | Su alcance lo define el servicio; no equivale a una ventana de 10, 30 o 365 días. |
| `Geofisica.EstacionesSismicas` | Estaciones sísmicas de velocidad. | Localización de instrumentación, no terremotos. |
| `Geofisica.HazardArea2002` | Áreas de peligrosidad sísmica del mapa NCSE-02 de 2002. | Producto de 2002; no es el mapa de 2015. |
| `Geofisica.HazardArea` | Alias de `Geofisica.HazardArea2002`. | Conservado por compatibilidad; prefiere el nombre con el año. |
| `Geofisica.HazardArea2015PGA` | Áreas de peligrosidad 2015, PGA-475. | Interpreta sus valores con la leyenda y documentación del producto. |
| `Geofisica.HazardArea2015Isolineas` | Isolíneas de peligrosidad 2015, PGA-475. | Representación por isolíneas del producto de 2015. |
| `Geofisica.HazardArea2015Intensidad` | Áreas de peligrosidad 2015, intensidad-475. | Representa intensidad, no aceleración PGA. |

## VigilanciaVolcanica

[Servicio WMS de volcanología del IGN](https://wms-volcanologia.ign.es/volcanologia?service=WMS&request=GetCapabilities).

| Nombre | Qué representa | Limitaciones o notas |
| --- | --- | --- |
| `VigilanciaVolcanica`, `VigilanciaVolcanica.ErupcionesHistoricas` | Erupciones históricas registradas en el servicio. | Cobertura localizada; comprobada alrededor de La Palma. No es un sistema de alertas en tiempo real. |

## CaminoDeSantiago

[Servicio WMS del Camino de Santiago](https://www.ign.es/wms-inspire/camino-santiago?service=WMS&request=GetCapabilities).
Cada variante muestra la familia de itinerarios indicada. No todas tienen
contenido en toda España; para información práctica de una ruta, consulta a su organismo responsable.

| Nombre | Qué representa | Limitaciones o notas |
| --- | --- | --- |
| `CaminoDeSantiago`, `CaminoDeSantiago.CaminoFrances` | Camino Francés. | Itinerario predeterminado. |
| `CaminoDeSantiago.CaminosFrancia` | Caminos de Francia. | Cobertura de los itinerarios recogidos en el servicio. |
| `CaminoDeSantiago.CaminosGalicia` | Caminos de Galicia. | Cobertura regional. |
| `CaminoDeSantiago.CaminosDelNorte` | Caminos del norte. | Cobertura de esa familia de itinerarios. |
| `CaminoDeSantiago.CaminosAndaluces` | Caminos andaluces. | Cobertura de esa familia de itinerarios. |
| `CaminoDeSantiago.CaminosCentro` | Caminos del centro. | Cobertura de esa familia de itinerarios. |
| `CaminoDeSantiago.CaminosEste` | Caminos del este. | Cobertura de esa familia de itinerarios. |
| `CaminoDeSantiago.CaminosNordeste` | Caminos del nordeste. | Nombre recomendado para la capa actual `caminos_nordeste`. |
| `CaminoDeSantiago.CaminosCatalanes` | Alias de `CaminoDeSantiago.CaminosNordeste`. | Compatibilidad: ya no solicita la antigua capa `caminos_catalanes`. |
| `CaminoDeSantiago.CaminosSureste` | Caminos del sureste. | Cobertura de esa familia de itinerarios. |
| `CaminoDeSantiago.CaminosInsulares` | Caminos insulares. | Cobertura insular según el servicio. |
| `CaminoDeSantiago.CaminosPortugueses` | Caminos portugueses. | Cobertura de esa familia de itinerarios. |

## Catastro

[WMS INSPIRE de Catastro](https://ovc.catastro.meh.es/cartografia/INSPIRE/spadgcwms.aspx?service=WMS&request=GetCapabilities)
y [WMS clásico](https://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx?service=WMS&request=GetCapabilities).
La cobertura es la ofrecida por estos servicios. La imagen WMS no permite
seleccionar una parcela ni obtener por sí sola su ficha catastral.

| Nombre | Qué representa | Limitaciones o notas |
| --- | --- | --- |
| `Catastro`, `Catastro.CadastralParcel` | Parcelas catastrales INSPIRE. | Zoom mínimo 10; WMS 1.3.0. |
| `Catastro.Catastro` | Cartografía catastral del servicio clásico. | Zoom mínimo 1; WMS 1.1.1. El servicio decide qué detalle muestra a cada escala. |
| `Catastro.Parcela` | Parcelas del servicio clásico. | Zoom mínimo 15; WMS 1.1.1. |
| `Catastro.CadastralZoning` | Zonificación catastral INSPIRE. | Zoom mínimo 10. |
| `Catastro.Address` | Direcciones INSPIRE de Catastro. | Zoom mínimo 10; no es la capa de direcciones de Cartociudad. |
| `Catastro.Building` | Edificios INSPIRE. | Zoom mínimo 10. |
| `Catastro.BuildingPart` | Partes de edificios INSPIRE. | Zoom mínimo 10. |
| `Catastro.AdministrativeBoundary` | Límites administrativos del servicio catastral. | Zoom mínimo 10; fuente distinta de UnidadesAdm. |
| `Catastro.AdministrativeUnit` | Unidades administrativas del servicio catastral. | Zoom mínimo 10. |

## RedTransporte

[Servicio WMS de transportes de IDEE](https://servicios.idee.es/wms-inspire/transportes?service=WMS&request=GetCapabilities).
Las capas representan infraestructuras, no tráfico, horarios ni disponibilidad
en tiempo real. Los elementos pequeños requieren acercarse a su ubicación.

| Nombre | Qué representa | Limitaciones o notas |
| --- | --- | --- |
| `RedTransporte`, `RedTransporte.Carreteras` | Tramos de la red de carreteras. | Representación de la red, no un servicio de cálculo de rutas. |
| `RedTransporte.Ferroviario` | Tramos de la red ferroviaria. | No incluye información operativa en tiempo real. |
| `RedTransporte.Aerodromo` | Áreas de aeródromos. | Cobertura localizada. |
| `RedTransporte.Pistas` | Áreas de pistas de aeródromos. | Detalle aeroportuario; cobertura localizada. |
| `RedTransporte.CallesRodaje` | Áreas de calles de rodaje. | Detalle aeroportuario; cobertura localizada. |
| `RedTransporte.Plataformas` | Áreas de plataformas aeroportuarias. | Detalle aeroportuario; cobertura localizada. |
| `RedTransporte.TransporteCable` | Enlaces de transporte por cable. | Solo donde el servicio recoge estos elementos. |
| `RedTransporte.AreaServicio` | Áreas de servicio de la red viaria. | Elementos localizados, no un inventario de servicios comerciales. |
| `RedTransporte.EstacionesFerroviario` | Áreas de estaciones ferroviarias. | No muestra salidas, llegadas ni horarios. |
| `RedTransporte.Puertos` | Áreas portuarias. | Cobertura localizada en puertos. |

## Cartociudad

[Servicio WMS de direcciones y códigos postales](https://www.cartociudad.es/wms-inspire/direcciones-ccpp?service=WMS&request=GetCapabilities).
Los umbrales se comprobaron en Madrid y Logroño con teselas estándar de 256 × 256
píxeles. El renderizado depende de la escala; parámetros o tamaños de tesela
distintos pueden modificar lo que se ve.

| Nombre | Qué representa | Limitaciones o notas |
| --- | --- | --- |
| `Cartociudad`, `Cartociudad.CodigosPostales` | Representación de códigos postales. | Zoom mínimo 11; las muestras en zoom 9 y 10 eran transparentes. No es una descarga de polígonos postales. |
| `Cartociudad.Direcciones` | Direcciones de Cartociudad. | Zoom mínimo 17; las muestras en zoom 15 y 16 eran transparentes. No es un geocodificador. |

## NombresGeograficos

[Servicio WMS de nombres geográficos del IGN](https://www.ign.es/wms-inspire/ngbe?service=WMS&request=GetCapabilities).

| Nombre | Qué representa | Limitaciones o notas |
| --- | --- | --- |
| `NombresGeograficos` | Topónimos de la capa INSPIRE de nombres geográficos. | Zoom mínimo 6. La colocación de etiquetas depende del servicio y la escala. |

## UnidadesAdm

[Servicio WMS de unidades administrativas del IGN](https://www.ign.es/wms-inspire/unidades-administrativas?service=WMS&request=GetCapabilities).
La capa histórica se sirve por separado; el plugin no añade un selector temporal.

| Nombre | Qué representa | Limitaciones o notas |
| --- | --- | --- |
| `UnidadesAdm`, `UnidadesAdm.Limites` | Límites administrativos. | Representa líneas de límite, no las superficies de las unidades. |
| `UnidadesAdm.LimitesHistoricos` | Límites administrativos históricos. | Consulta los metadatos del servicio para interpretar su referencia temporal. |
| `UnidadesAdm.Unidades` | Unidades administrativas. | Representa las unidades del servicio; no sustituye a una descarga de sus geometrías. |

## Hidrografia

[Servicio WMS de hidrografía de IDEE](https://servicios.idee.es/wms-inspire/hidrografia?service=WMS&request=GetCapabilities).
Subcuencas usa un [servicio específico de MITECO](https://gis.miteco.gob.es/geoserver/agua/subcuencas/wms?service=WMS&request=GetCapabilities).
Son capas de referencia hidrográfica, no mediciones de caudal o estado del agua
en tiempo real. La presencia de elementos y su detalle varían con la zona y escala.

| Nombre | Qué representa | Limitaciones o notas |
| --- | --- | --- |
| `Hidrografia`, `Hidrografia.MasaAgua` | Masas de agua. | Representación de elementos hidrográficos. |
| `Hidrografia.Cuencas` | Cuencas hidrográficas. | Delimitaciones de cuencas del servicio IDEE. |
| `Hidrografia.Subcuencas` | Subcuencas de los cauces de la red hidrográfica básica. | Servicio MITECO distinto del resto de variantes. |
| `Hidrografia.POI` | Puntos de interés hidrográfico. | Solo donde existen elementos en el servicio. |
| `Hidrografia.ManMade` | Objetos artificiales de la hidrografía. | Zoom mínimo 10. |
| `Hidrografia.LineaCosta` | Límite entre tierra y agua. | No equivale a los límites marítimos de la capa LimitesMaritimos. |
| `Hidrografia.Rios` | Red hidrográfica. | Zoom mínimo 6. |
| `Hidrografia.Humedales` | Humedales. | Cobertura localizada según el inventario del servicio. |

## Militar

[Servicio WMS de cartografía militar](https://wms-defensa.idee.es/mapas?service=WMS&request=GetCapabilities).
Cada variante representa una serie cartográfica. Su cobertura, edición y detalle
dependen de esa serie; ampliar la imagen no aumenta el detalle de origen.

| Nombre | Qué representa | Limitaciones o notas |
| --- | --- | --- |
| `Militar`, `Militar.CEGET1M` | Cartografía de la serie CEGET 1M. | Consulta la cobertura y edición de la serie. |
| `Militar.CEGETM7814` | Cartografía de la serie CEGET M7814. | Cobertura y detalle propios de esa serie. |
| `Militar.CEGETM7815` | Cartografía de la serie CEGET M7815. | Cobertura y detalle propios de esa serie. |
| `Militar.CEGETM682` | Cartografía de la serie CEGET M682. | Cobertura y detalle propios de esa serie. |
| `Militar.CECAF1M` | Cartografía de la serie CECAF CNV 1M. | Producto distinto de las series CEGET. |

## ADIF

El servicio configurado es `http://ideadif.adif.es/services/wms`.
Las peticiones HTTP y HTTPS devolvieron **403** en la auditoría del 27 de octubre
de 2026. No se pudo verificar su contenido; eso no demuestra que se haya retirado.
Además, la URL HTTP configurada puede quedar bloqueada como contenido mixto en
una página HTTPS. Las configuraciones se conservan, pero no se garantiza su uso.

| Nombre | Qué representa según la configuración | Limitaciones o notas |
| --- | --- | --- |
| `ADIF`, `ADIF.Vias` | Tramos de la red ferroviaria de ADIF. | Servicio no verificado; respuesta 403 en la auditoría. |
| `ADIF.Nodos` | Nodos de la red ferroviaria. | Servicio no verificado; respuesta 403 en la auditoría. |
| `ADIF.Estaciones` | Nodos de estaciones ferroviarias. | Servicio no verificado; respuesta 403 en la auditoría. |

## LimitesMaritimos

[Servicio WMS del Instituto Hidrográfico de la Marina](https://ideihm.covam.es/ihm-inspire/wms-unidadesmaritimas?service=WMS&request=GetCapabilities).
Son capas de referencia de unidades marítimas, no cartas para navegación.

| Nombre | Qué representa | Limitaciones o notas |
| --- | --- | --- |
| `LimitesMaritimos`, `LimitesMaritimos.LimitesMaritimos` | Límites de unidades marítimas. | Cobertura marítima; puede no haber contenido sobre tierra. |
| `LimitesMaritimos.LineasBase` | Líneas de base. | Elementos distintos de los límites de unidades marítimas. |

## Copernicus

Productos de [Copernicus Land Monitoring Service](https://land.copernicus.eu/),
servidos por EEA. Las ocho variantes soportadas se migraron y comprobaron el
28 de octubre de 2026. Su cobertura es europea, con zonas sin datos según el
producto; conservan los años de referencia 2012 y 2015, no la actualidad.
Consulta la [política de datos](https://land.copernicus.eu/en/data-policy).

| Nombre | Qué representa | Limitaciones o notas |
| --- | --- | --- |
| `Copernicus`, `Copernicus.Forest` | Densidad de cobertura arbórea de 2015. | Combina las capas WMS de 20 m y 100 m según escala; no es un inventario forestal actual. |
| `Copernicus.ForestLeaf` | Tipo de hoja dominante de 2015. | WMS en EPSG:4326; el plugin configura ese CRS automáticamente. |
| `Copernicus.WaterWet` | Agua y humedad de 2015. | Producto temático de referencia; no muestra inundaciones actuales. |
| `Copernicus.SoilSeal` | Densidad de impermeabilización del suelo de 2015. | No representa cambios posteriores a ese producto. |
| `Copernicus.GrassLand` | Pastizales de 2015. | Cobertura y clasificación propias del producto. |
| `Copernicus.RiparianLandCover` | Cobertura del suelo de zonas ribereñas de 2012. | Cobertura localizada; combina capas ráster y vectoriales del WMS según escala. |
| `Copernicus.Natura2k` | Producto Natura 2000 de 2012. | Limitado a la cobertura del producto; no es el inventario vigente de espacios protegidos. |
| `Copernicus.UrbanAtlas` | Usos del suelo de Urban Atlas 2012. | Zoom mínimo 8; cobertura de las zonas urbanas incluidas en el producto. |
| `Copernicus.RiparianGreen` | Antigua capa de elementos lineales verdes de zonas ribereñas. | Deprecada: endpoint IGN no disponible, sin sustituto equivalente confirmado. No aparece en Preview ni en el visor. |

## ParquesNaturales

Aunque el proveedor se llama `ParquesNaturales`, sus capas corresponden a
**parques nacionales** y sus zonas periféricas de protección del OAPN.
[Capacidades del servicio WMS](https://sigred.oapn.es/geoserverOAPN/LimitesParquesNacionalesZPP/ows?service=WMS&request=GetCapabilities).
No es un inventario de todos los espacios naturales protegidos. En la auditoría,
algunos clientes tuvieron problemas con la cadena de certificados del servidor;
la comprobación con el almacén TLS de Windows sí obtuvo imágenes.

| Nombre | Qué representa | Limitaciones o notas |
| --- | --- | --- |
| `ParquesNaturales`, `ParquesNaturales.Limites` | Límites de parques nacionales. | Cobertura localizada en los parques recogidos por OAPN. |
| `ParquesNaturales.ZonasPerifericas` | Zonas periféricas de protección de parques nacionales. | No todos los parques tienen necesariamente una zona representada. |


## PNOAHistorico

Vuelos históricos y selección quinquenal del PNOA. La cobertura varía por vuelo y año; las zonas sin ortofoto pueden devolver imágenes vacías.

[Capacidades del servicio](https://www.ign.es/wms/pnoa-historico?service=WMS&request=GetCapabilities&version=1.3.0). Atribución: IGN / Sistema Cartogr&aacute;fico Nacional.

| Nombre | Contenido |
| --- | --- |
| `PNOAHistorico.Americano`, `PNOAHistorico` | Americano (Serie B, 1956-1957) |
| `PNOAHistorico.Interministerial` | Interministerial (1973-1986) |
| `PNOAHistorico.Nacional` | Nacional (1981-1986) |
| `PNOAHistorico.OLISTAT` | OLISTAT (1997-1998) |
| `PNOAHistorico.SIGPAC` | SIGPAC (1997-2003) |
| `PNOAHistorico.PNOA2004` | PNOA 2004 |
| `PNOAHistorico.PNOA2009` | PNOA 2009 |
| `PNOAHistorico.PNOA2014` | PNOA 2014 |
| `PNOAHistorico.PNOA2019` | PNOA 2019 |
| `PNOAHistorico.PNOA2024` | PNOA 2024 |

## MTNHistorico

Primeras ediciones MTN50 y MTN25 y minutas MTN50. Documentos históricos de fechas variables según la hoja; zoom nativo 19.

[Capacidades del servicio](https://www.ign.es/wmts/primera-edicion-mtn?service=WMTS&request=GetCapabilities&version=1.0.0). Atribución: IGN / Sistema Cartogr&aacute;fico Nacional.

| Nombre | Contenido |
| --- | --- |
| `MTNHistorico.MTN50`, `MTNHistorico` | Primera edición MTN50 |
| `MTNHistorico.MTN25` | Primera edición MTN25 |
| `MTNHistorico.Minutas` | Minutas MTN50 (catastrones) |

## Inundaciones

Peligrosidad por inundación fluvial y marina. El periodo de retorno no es una predicción de fecha; cobertura limitada a las zonas estudiadas.

[Capacidades del servicio](https://servicios.idee.es/wms-inspire/riesgos-naturales/inundaciones?service=WMS&request=GetCapabilities&version=1.3.0). Atribución: MITECO.

| Nombre | Contenido |
| --- | --- |
| `Inundaciones.FluvialT10`, `Inundaciones` | Fluvial T = 10 años |
| `Inundaciones.FluvialT100` | Fluvial T = 100 años |
| `Inundaciones.FluvialT500` | Fluvial T = 500 años |
| `Inundaciones.MarinaT100` | Marina T = 100 años |
| `Inundaciones.MarinaT500` | Marina T = 500 años |

## RedNatura

Red Natura 2000. Incluye espacios de la red europea; no equivale al conjunto de espacios naturales protegidos.

[Capacidades del servicio](https://iepnb.gob.es/geoserver/RN2000/rn2000/wms?service=WMS&request=GetCapabilities&version=1.3.0). Atribución: MITECO.

| Nombre | Contenido |
| --- | --- |
| `RedNatura.General`, `RedNatura` | Red Natura 2000 |

## EspaciosProtegidos

Espacios naturales protegidos recopilados por MITECO. Las figuras y coberturas dependen de la información comunicada por las administraciones.

[Capacidades del servicio](https://iepnb.gob.es/geoserver/ENP/enp/wms?service=WMS&request=GetCapabilities&version=1.3.0). Atribución: MITECO.

| Nombre | Contenido |
| --- | --- |
| `EspaciosProtegidos.General`, `EspaciosProtegidos` | Espacios naturales protegidos |

## SeccionesINE

Secciones y distritos estadísticos de 2026 y 2021. Son límites territoriales, sin indicadores de población; no deben mezclarse años al unir datos.

[Capacidades del servicio](https://servicios.ine.es/arcgis/services/WMS_INE_SECCIONES_G01/MapServer/WMSServer?service=WMS&request=GetCapabilities&version=1.3.0). Atribución: Instituto Nacional de Estad&iacute;stica (INE).

| Nombre | Contenido |
| --- | --- |
| `SeccionesINE.Secciones2026`, `SeccionesINE` | Secciones2026 |
| `SeccionesINE.Distritos2026` | Distritos2026 |
| `SeccionesINE.Secciones2021` | Secciones2021 |
| `SeccionesINE.Distritos2021` | Distritos2021 |

## Pendientes

Modelo Digital de Pendientes MDP05. Imagen temática de pendientes; no descarga un modelo de elevaciones.

[Capacidades del servicio](https://wms-pendientes.idee.es/pendientes?service=WMS&request=GetCapabilities&version=1.3.0). Atribución: IGN / Sistema Cartogr&aacute;fico Nacional.

| Nombre | Contenido |
| --- | --- |
| `Pendientes.MDP05`, `Pendientes` | Modelo Digital de Pendientes |

## GEODE

Cartografía geológica continua del IGME-CSIC. La composición predeterminada reúne unidades, contactos, Cuaternario, ejes, buzamientos y rótulos. Detalle y cobertura según la cartografía de origen. La variante Cuaternario estaba anunciada en capacidades, pero no mostró elementos en las muestras consultadas.

[Capacidades del servicio](https://mapas.igme.es/gis/services/Cartografia_Geologica/IGME_Geode_50/MapServer/WMSServer?service=WMS&request=GetCapabilities&version=1.3.0). Atribución: IGME-CSIC.

| Nombre | Contenido |
| --- | --- |
| `GEODE.Geologia`, `GEODE` | Recintos geología + Contactos + Cuaternario - Recintos  + Cuaternario - Lineas auxiliares + Ejes + Buzamientos + Rótulos unidades |
| `GEODE.Unidades` | Recintos geología |
| `GEODE.Contactos` | Contactos |
| `GEODE.Cuaternario` | Cuaternario - Recintos  |

## SIGPAC

Recintos y elementos del paisaje agrario. El servicio actual no publica una capa independiente de parcelas. El cultivo declarado corresponde a 2025; el contenido de recintos puede actualizarse. Las capas de elementos del paisaje estaban anunciadas en capacidades, pero las muestras consultadas no contenían elementos visibles.

[Capacidades del servicio](https://sigpac-hubcloud.es/wms?service=WMS&request=GetCapabilities&version=1.3.0). Atribución: FEGA / MAPA.

| Nombre | Contenido |
| --- | --- |
| `SIGPAC.Recintos`, `SIGPAC` | Recinto |
| `SIGPAC.CultivoDeclarado2025` | Cultivo Declarado 2025 |
| `SIGPAC.PaisajeAreas` | E. Paisaje - Área |
| `SIGPAC.PaisajeLineas` | E. Paisaje - Línea |
| `SIGPAC.PaisajePuntos` | E. Paisaje - Punto |

## MapaForestal

Usos del Mapa Forestal de España, foto fija. Mapa general; no incluye una variante por especie.

[Capacidades del servicio](https://iepnb.gob.es/geoserver/foto_fija_mfe/ff_uso/wms?service=WMS&request=GetCapabilities&version=1.3.0). Atribución: MITECO.

| Nombre | Contenido |
| --- | --- |
| `MapaForestal.Usos`, `MapaForestal` | Usos del Mapa Forestal de España |

## Planimetrias

Planimetrías históricas de 1870 a 1950. Cobertura y fecha según la hoja; zoom nativo 20.

[Capacidades del servicio](https://www.ign.es/wmts/minutas-cartograficas?service=WMTS&request=GetCapabilities&version=1.0.0). Atribución: IGN / Sistema Cartogr&aacute;fico Nacional.

| Nombre | Contenido |
| --- | --- |
| `Planimetrias.Minutas`, `Planimetrias` | Planimetrías (1870-1950) |

## CaminosNaturales

Etapas de la Red de Caminos Naturales. Capa de itinerarios; no ofrece cálculo de rutas.

[Capacidades del servicio](https://wms.mapama.gob.es/sig/desarrollorural/ccnn_etapas?service=WMS&request=GetCapabilities&version=1.3.0). Atribución: MAPA.

| Nombre | Contenido |
| --- | --- |
| `CaminosNaturales.Etapas`, `CaminosNaturales` | Caminos Naturales - Etapas |

## SpainByBike

Etapas, tipos de vía, centros BTT y puertos de montaña. Las líneas y puntos se ofrecen por separado.

[Capacidades del servicio](https://wms-spainbybike.idee.es/spainbybike?service=WMS&request=GetCapabilities&version=1.3.0). Atribución: IGN / Sistema Cartogr&aacute;fico Nacional.

| Nombre | Contenido |
| --- | --- |
| `SpainByBike.Etapas`, `SpainByBike` | Etapas |
| `SpainByBike.TiposVia` | Tipos de vía |
| `SpainByBike.CentrosBTT` | Centros BTT |
| `SpainByBike.Puertos` | Puertos de montaña (líneas) |
| `SpainByBike.PuertosPuntos` | Puertos de montaña (puntos) |

## ViasPecuarias

Red General de Vías Pecuarias, edición 2024. La cobertura depende de la información incorporada al inventario.

[Capacidades del servicio](https://iepnb.gob.es/geoserver/vias_pecuarias/rgvp_2024/wms?service=WMS&request=GetCapabilities&version=1.3.0). Atribución: MITECO.

| Nombre | Contenido |
| --- | --- |
| `ViasPecuarias.Red2024`, `ViasPecuarias` | Red General de Vías Pecuarias (2024) |

## PotencialSolar

Potencial solar global y en edificios. Cartografía temática estimada; zoom nativo 20.

[Capacidades del servicio](https://wmts-potencial-solar.idee.es/potencial-solar?service=WMTS&request=GetCapabilities&version=1.0.0). Atribución: IGN / Sistema Cartogr&aacute;fico Nacional.

| Nombre | Contenido |
| --- | --- |
| `PotencialSolar.Global`, `PotencialSolar` | Potencial Solar Global |
| `PotencialSolar.Edificios` | Potencial Solar Edificios |

</div>
