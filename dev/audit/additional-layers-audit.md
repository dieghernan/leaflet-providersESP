# Additional advertised layers

Checked: 2026-10-28T17:44:31.455004+00:00

Live GetCapabilities inventory against the current catalog. An advertised name is a candidate, not proof that it renders useful images. Group layers, backgrounds and components already included in composite layers need individual assessment before adding public variants.

45 additional names across 10 endpoints. ADIF and the retired IGN Copernicus endpoint could not be inventoried; their failures do not establish that they have no additional layers.

## https://www.ign.es/wmts/ign-base

| Layer | Title |
| --- | --- |
| `IGNBaseSimplificado` | Callejero simplificado |

## https://servicios.idee.es/wms-inspire/mdt

| Layer | Title |
| --- | --- |
| `EL.ElevationGridCoverage` | Modelo Digital del Terreno |

## https://www.ign.es/wms-inspire/pnoa-ma

| Layer | Title |
| --- | --- |
| `OI.OrthoimageCoverage` | Ortoimagen |
| `fondo` | Fondo |

## https://ign.es/wmts/mapa-raster

| Layer | Title |
| --- | --- |
| `MTN_Fondo` | Fondo |

## https://www.ign.es/wms-inspire/geofisica

| Layer | Title |
| --- | --- |
| `GE.Geophysics.seismologicalStation` | Estaciones sísmicas de velocidad |
| `HazardArea2015.PGA475_p` | Áreas de peligrosidad 2015-PGA-475 |
| `HazardArea2015.PGA475_c` | Isolíneas de peligrosidad 2015-PGA-475 |
| `HazardArea2015.Int475` | Áreas de peligrosidad 2015-Intensidad-475 |

## https://wms-volcanologia.ign.es/volcanologia

| Layer | Title |
| --- | --- |
| `sis` | Estaciones sísmicas |
| `gps` | Estaciones GNSS |
| `displacement-asc` | Desplazamiento en órbita ascendente |
| `phase-asc` | Fase en órbita ascendente |
| `coh-asc` | Coherencia en órbita ascendente |
| `displacement-des` | Desplazamiento en órbita descendente |
| `phase-des` | Fase en órbita descendente |
| `coh-des` | Coherencia en órbita descendente |
| `eto` | Estaciones totales |
| `inc` | Inclinómetros |
| `gqme` | Estaciones geoquímicas |
| `gqmp` | Puntos de muestreo |
| `gra` | Estaciones gravimétricas |
| `rega` | Red Española de Gravimetría Absoluta REGA |
| `mag` | Magnetómetros |
| `wcmv` | Cámara visual (espectro visible) |
| `wcmt` | Cámara térmica (infrarrojo) |

## https://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx

| Layer | Title |
| --- | --- |
| `CONSTRU` | CONSTRU |
| `TXTCONSTRU` | TXTCONSTRU |
| `SUBPARCE` | SUBPARCE |
| `TXTSUBPARCE` | TXTSUBPARCE |
| `TXTPARCELA` | TXTPARCELA |
| `MASA` | MASA |
| `TXTMASA` | TXTMASA |
| `EJES` | EJES |
| `LIMITES` | LIMITES |
| `TEXTOS` | TEXTOS |
| `ELEMLIN` | ELEMLIN |

## https://servicios.idee.es/wms-inspire/transportes

| Layer | Title |
| --- | --- |
| `TN.AirTransportNetwork.RunwayArea` | Área de pista |
| `TN.AirTransportNetwork.TaxiwayArea` | Área de calle de rodaje |
| `TN.AirTransportNetwork.ApronArea` | Área de plataforma |
| `TN.CableTransportNetwork.CablewayLink` | Enlace de cable transportador |

## https://www.ign.es/wms-inspire/unidades-administrativas

| Layer | Title |
| --- | --- |
| `LimitesHistoricos` | Límites históricos |
| `LimitesTime` | Límites históricos y vigentes consultables por fecha |

## https://wms-defensa.idee.es/mapas

| Layer | Title |
| --- | --- |
| `Ministerio-Defensa` | Cartografía Militar |
| `ceget_P713` | Serie P713 (CEGET) |

## Unavailable endpoints

- http://ideadif.adif.es/services/wms: HTTP Error 403: Forbidden
- https://servicios.idee.es/wms/copernicus-landservice-spain: [WinError 10054] Se ha forzado la interrupción de una conexión existente por el host remoto

## Selected additions verified on 2026-10-28

Ten public variants were added after checking their advertised identifiers, image formats, styles and CRS against capabilities. GetMap/GetTile samples decoded as 256 × 256 images with nonzero visible pixels. These are sample checks, not a guarantee of coverage at every location or zoom. The temporal `LimitesTime` layer remains a candidate because selecting a date needs a documented TIME workflow.

| Variant | Sample | Zoom | Visible pixels |
| --- | --- | --- | --- |
| `IGNBase.Simplificado` | Central Spain | 8 | 15406 |
| `Geofisica.EstacionesSismicas` | Central Spain | 8 | 1562 |
| `Geofisica.HazardArea2015PGA` | Central Spain | 8 | 65536 |
| `Geofisica.HazardArea2015Isolineas` | Central Spain | 8 | 746 |
| `Geofisica.HazardArea2015Intensidad` | Central Spain | 8 | 65536 |
| `RedTransporte.Pistas` | Barajas | 13 | 1359 |
| `RedTransporte.CallesRodaje` | Barajas | 13 | 13867 |
| `RedTransporte.Plataformas` | Barajas | 13 | 3649 |
| `RedTransporte.TransporteCable` | Teide | 12 | 176 |
| `UnidadesAdm.LimitesHistoricos` | Central Spain | 8 | 15525 |

The inventory above records the catalog before these additions. ADIF remains unchanged.
