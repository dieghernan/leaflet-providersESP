# Provider capabilities audit

Audit date: 2026-10-27.

## Scope and evidence

The initial catalog had 21 providers and 102 configurations when default provider
names and explicit variants were counted separately. The preferred names
`CaminoDeSantiago.CaminosNordeste` and `Geofisica.HazardArea2002` bring the current
total to 104 configurations, retaining the old names as compatibility aliases.
These use the same 24 OGC endpoints plus
IDErioja's XYZ service. The audit retrieved 22 valid capabilities documents;
ADIF and Copernicus could not be verified. The recorded documents advertise 113
layers, including layers outside this project's curated selection.

Checks covered layer identifiers, WMS versions, EPSG:3857 support, image formats,
WMTS styles and matrix sets. Additional requests tested Cartociudad's rendering
thresholds, HTTPS endpoints and WMTS zoom limits. HTTP 200 alone was not treated
as success: XML exception reports and fully transparent images were identified.

The complete image pass made 159 requests: 145 returned decodable images and 14
failed at ADIF or Copernicus. This includes 60 Cartociudad requests covering its
default name and two variants in two cities at zooms 9 through 18. A transparent
image is a rendering observation, not proof of a broken service: a location may
have no features for the requested layer. Later targeted tests also verified the
corrected MDT styles and the WMTS zoom boundaries.

[The capabilities snapshot](fixtures/capabilities-2026-10-27.json) records service
versions, names, formats, styles, CRS support and the two unverified endpoints.
It supports offline regression tests; it does not guarantee future availability.

## Cartociudad

The [current WMS capabilities](https://www.cartociudad.es/wms-inspire/direcciones-ccpp?service=WMS&request=GetCapabilities&version=1.3.0)
advertise `codigo-postal` and `AD.Address`, WMS 1.3.0 and EPSG:3857.
Postal codes advertise a maximum scale denominator of 500000, while addresses
advertise 8000. These are scale limits rather than Leaflet zoom numbers.

The following results use standard 256 x 256 EPSG:3857 requests around central
Madrid (-3.7038, 40.4166) and Logrono (-2.4456, 42.465). Both cities showed the
same zoom thresholds. Tests with WMS 1.1.1 and 1.3.0 agreed at the boundaries.

| Layer | Zoom | Madrid: nontransparent pixels | Logrono: nontransparent pixels |
| --- | --- | ---: | ---: |
| `codigo-postal` | 9 | 0 | 0 |
| `codigo-postal` | 10 | 0 | 0 |
| `codigo-postal` | 11 | 8964 | 6086 |
| `AD.Address` | 15 | 0 | 0 |
| `AD.Address` | 16 | 0 | 0 |
| `AD.Address` | 17 | 768 | 676 |
| `AD.Address` | 18 | 669 | 256 |

Pixel counts are samples, not stable expected values. Data or label placement may
change between requests. Postal codes were visible through zoom 18 as well.

The user's existing change from `minZoom: 14` to `11` is retained and documented
for the default provider and postal-code variant. Addresses change from 15 to 17.
These thresholds describe the tested standard tile requests; custom tile sizes
or request parameters may affect scale-dependent rendering.

## Service inventory

All listed versions were read from capabilities, including negotiated responses.
WMS GetMap requests were also tested. WMTS remains at version 1.0.0.

| Provider | Verified protocol | Result and action |
| --- | --- | --- |
| `IDErioja` | XYZ | All four variants returned images around Logrono. There is no OGC capabilities document. |
| `IGNBase` | WMTS 1.0.0 | Configured layers, formats, styles and GoogleMapsCompatible matrix set match. Native zoom limited to 20. |
| `MDT` | WMTS 1.0.0 / WMS 1.3.0 | Correct WMTS styles to `Elevaciones` and `Default`. WMS variants use 1.3.0 and keep independent zoom behavior. |
| `PNOA` | WMTS 1.0.0 / WMS 1.3.0 | Mosaico moves to HTTPS and WMS 1.3.0. Native WMTS zoom limited to 20. |
| `OcupacionSuelo` | WMTS 1.0.0 | Use each layer's advertised `.Default` style and remove the duplicate style parameter. Native zoom limited to 20. |
| `LiDAR` | WMTS 1.0.0 | Configured layer and style match. Native zoom limited to 20. |
| `MTN` | WMTS 1.0.0 | Remove duplicate style parameter. Native zoom limited to 20. |
| `Geofisica` | WMS 1.3.0 | `NZ.HazardArea` returns LayerNotDefined. Existing `HazardArea` now selects `HazardArea2002.NCSE-02`. |
| `VigilanciaVolcanica` | WMS 1.3.0 | `erupciones` remains advertised and returns an image around La Palma. Set WMS version explicitly. |
| `CaminoDeSantiago` | WMS 1.3.0 | `caminos_catalanes` returns LayerNotDefined. Existing `CaminosCatalanes` selects `caminos_nordeste`, which returns visible content in northeastern Spain. |
| `Catastro` | WMS 1.3.0 / 1.1.1 | INSPIRE layers support 1.3.0. The classic endpoint negotiates 1.1.1, retained for `Catastro` and `Parcela` variants. Move both classic URLs to HTTPS. |
| `RedTransporte` | WMS 1.3.0 | All configured layer identifiers are advertised. Set WMS version explicitly. |
| `Cartociudad` | WMS 1.3.0 | Correct rendering thresholds as detailed above. |
| `NombresGeograficos` | WMS 1.3.0 | Configured layer remains available. Set WMS version explicitly. |
| `UnidadesAdm` | WMS 1.3.0 | Both configured layers remain available. Set WMS version explicitly. |
| `Hidrografia` | WMS 1.3.0 | Main service matches. Replace the Subcuencas endpoint and layer as detailed below. |
| `Militar` | WMS 1.3.0 | All configured layers remain advertised. Use HTTPS directly and set WMS version explicitly. |
| `ADIF` | Unverified | HTTP and HTTPS return 403 Access Denied, including the homepage. This does not establish withdrawal. Keep configuration pending further verification. |
| `LimitesMaritimos` | WMS 1.3.0 | Both configured layers remain advertised. Use HTTPS directly and set WMS version explicitly. |
| `Copernicus` | Unverified | IGN endpoint closes the connection. Official withdrawal notice and replacement candidates are recorded below. |
| `ParquesNaturales` | WMS 1.3.0 | Both layers remain advertised. HTTPS capabilities and GetMap succeed with the Windows system TLS store. Use HTTPS and set WMS version explicitly. |

Python's TLS validation initially failed for OAPN due to an issuer-chain error.
Windows curl validated the HTTPS connection without disabling verification and
retrieved both capabilities and a visible map image. The audit tool uses curl as
a fallback specifically for certificate-verification errors. Other clients may
still need to check their trust store or the server's certificate chain.

## Confirmed endpoint and identifier repairs

- [Geofisica capabilities](https://www.ign.es/wms-inspire/geofisica?service=WMS&request=GetCapabilities&version=1.3.0): `HazardArea2002.NCSE-02` is the explicit 2002 NCSE-02 map. Three separate 2015 hazard products are also advertised. The retained public alias now selects the 2002 product.
- [Camino de Santiago capabilities](https://www.ign.es/wms-inspire/camino-santiago?service=WMS&request=GetCapabilities&version=1.3.0): `caminos_nordeste` is titled Caminos del Nordeste. The public `CaminosCatalanes` alias is retained with the current layer name.
- [MITECO Subcuencas capabilities](https://gis.miteco.gob.es/geoserver/agua/subcuencas/wms?service=WMS&request=GetCapabilities&version=1.3.0): `subcuencas` is titled Subcuencas de los cauces de la red hidrográfica básica. Its metadata identifies the old SubcuencasCauces service. The old endpoint returns a ServiceExceptionReport containing a server-side NullReferenceException.

## WMTS styles and zoom limits

The advertised GoogleMapsCompatible matrices and per-layer limits cover zooms
0 through 20 in the six WMTS services. Requests at zoom 20 returned images around
Madrid; zoom 21 returned HTTP 400 in each service. `maxNativeZoom: 20` lets
Leaflet reuse the highest native level when an application enables higher zooms.
WMS variants explicitly clear the inherited WMTS limit. Existing minimum zooms
and application-controlled maximum zooms are preserved.

MDT advertises `Elevaciones` for `EL.ElevationGridCoverage` and `Default` for
`Relieve`. OcupacionSuelo advertises `LC.LandCoverSurfaces.Default` and
`LU.ExistingLandUse.Default`. The previous generic `default` was accepted by
the tested servers but did not match those advertised identifiers. Corrected
style requests also returned images.

## Copernicus initial audit (2026-10-27)

IDEE's [withdrawal notice](https://blog.idee.es/archivo/-/blogs/retirada-del-servicio-de-visualizacion-copernicus-land)
recommends the EEA services below for the existing 2012 and 2015 products.
Every candidate returned HTTP 502 during this audit; the response body states
that the server is undergoing maintenance. Their actual layer identifiers,
supported versions and map responses therefore remain unverified.

| Existing variant | Official replacement candidate |
| --- | --- |
| `Forest` | [Tree cover density 2015](https://image.discomap.eea.europa.eu/arcgis/services/GioLandPublic/HRL_TreeCoverDensity_2015/MapServer/WMSServer?request=GetCapabilities&service=WMS) |
| `ForestLeaf` | [Dominant leaf type 2015](https://image.discomap.eea.europa.eu/arcgis/services/GioLandPublic/HRL_DominantLeafType_2015/ImageServer/WMSServer?request=GetCapabilities&service=WMS) |
| `WaterWet` | [Water and wetness 2015](https://image.discomap.eea.europa.eu/arcgis/services/GioLandPublic/HRL_WaterWetness_2015/MapServer/WMSServer?request=GetCapabilities&service=WMS) |
| `SoilSeal` | [Imperviousness density 2015](https://image.discomap.eea.europa.eu/arcgis/services/GioLandPublic/HRL_ImperviousnessDensity_2015/MapServer/WMSServer?request=GetCapabilities&service=WMS) |
| `GrassLand` | [Grassland 2015](https://image.discomap.eea.europa.eu/arcgis/services/GioLandPublic/HRL_Grassland_2015/MapServer/WMSServer?request=GetCapabilities&service=WMS) |
| `RiparianLandCover` | [Riparian zones 2012](https://copernicus.discomap.eea.europa.eu/arcgis/services/RiparianZones/RZ_2012/MapServer/WMSServer?request=GetCapabilities&service=WMS) |
| `Natura2k` | [Natura 2000 2012](https://copernicus.discomap.eea.europa.eu/arcgis/services/Natura2000/N2K_2012/MapServer/WMSServer?request=GetCapabilities&service=WMS) |
| `UrbanAtlas` | [Urban atlas 2012](https://image.discomap.eea.europa.eu/arcgis/services/UrbanAtlas/UA_UrbanAtlas_2012/MapServer/WMSServer?request=GetCapabilities&service=WMS) |

The notice identifies no equivalent official WMS for `RiparianGreen`. Its proposed
thematic alternative, Small Woody Features 2021, changes both the product and
reference year. `Copernicus.RiparianGreen` is deprecated. Its existing
configuration remains callable, with one console warning per page, and is omitted
from the site's available-layer lists and previews. No replacement product is
selected automatically. The default Copernicus layer and all nine variants were
unavailable from this audit environment.

## Additional advertised layers (initial audit)

The catalog is a curated selection. Current capabilities also advertise
`IGNBaseSimplificado`, `MTN_Fondo`, the seismic-station layer
`GE.Geophysics.seismologicalStation`, three 2015 hazard layers and `ceget_P713`.
These have not been added automatically or validated as new public variants.
Their identifiers and metadata are represented in the capabilities snapshot.

## Relationship to leaflet-providers

The upstream [leaflet-providers implementation](https://github.com/leaflet-extras/leaflet-providers/blob/master/leaflet-providers.js)
remains the reference for provider/variant definitions, option precedence and
attribution expansion. The public `providerESP` factory is retained. This project
also routes WMS configurations through Leaflet's WMS constructor and interprets
string variants as WMS layer names where appropriate.

Leaflet's [WMS implementation](https://github.com/Leaflet/Leaflet/blob/v1.9.4/src/layer/tile/TileLayer.WMS.js)
selects `crs` for WMS 1.3.0, `srs` for 1.1.1 and the required EPSG:4326 axis order.
Explicit service versions are ordinary provider options; caller overrides keep
the same precedence. Version 1.3.0 here refers to the WMS protocol, independently
of the plugin's release number.

## Reproduce the checks

Install the development dependencies with `npm ci` and Chromium with
`npx playwright install chromium`. Run lint, unit tests and browser integration
tests together:

```sh
npm test
```

The browser suite exercises both the source and minified distributions using
real Leaflet 1.9.4 and leaflet-providers 4.0.0, with controlled tile responses.
It verifies WMS 1.3.0 and 1.1.1, the EPSG:4326 axis
order, PNG tile loading and opacity, zoom 22 using native WMTS zoom 20, WMS
variants without that ceiling and both plugin loading orders. It does not
recheck live provider availability.

Run only the unit tests with Node.js:

```sh
node --test dev/providers.test.js
```

Retrieve current capabilities with Python and Node.js:

```sh
py dev/audit-providers.py --output audit.json
```

Add image checks with a Python installation that includes Pillow:

```sh
py dev/audit-providers.py --images --output audit-with-images.json
py dev/audit-providers.py --provider Cartociudad --images --output cartociudad.json
```

The live audit exits with a nonzero status when a capabilities request, configured
layer lookup or image request fails. A full run currently reports the unresolved
ADIF and Copernicus failures. Empty images are recorded separately from request
failures. The offline tests validate all 85 OGC configurations with recorded
capabilities; the five XYZ configurations have no capabilities and the remaining
14 configurations belong to the two unresolved providers.

## Copernicus migration verified on 2026-10-28

The eight official EEA replacements listed above now return valid WMS 1.3.0
capabilities. The default provider and all eight supported variants have migrated;
public names and reference years remain unchanged. European product coverage
replaces the former Spain service. ADIF is unchanged. Only deprecated
`RiparianGreen` retains the unavailable IGN endpoint and its WMS 1.1.1 setup.

| Variant | Requested layers | CRS |
| --- | --- | --- |
| Default / Forest | `0,1` (20 m / 100 m) | EPSG:3857 |
| ForestLeaf | `HRL_DominantLeafType_2015` | EPSG:4326 |
| WaterWet / SoilSeal / GrassLand | `0,1` (20 m / 100 m) | EPSG:3857 |
| RiparianLandCover / Natura2k | `0,1` (raster / vector WMS identifiers) | EPSG:3857 |
| UrbanAtlas | `Land_Use_Raster1402,Land_Use_vector52160` | EPSG:3857 |

The ForestLeaf service does not advertise EPSG:3857. Its explicit Leaflet CRS
preserves correct latitude/longitude axis order in WMS 1.3.0 on a Mercator map.
Preview examples retain the `L.CRS.EPSG4326` reference rather than serializing it
as a plain object. Caller CRS and version overrides remain available.

Requesting only the overview raster made Riparian, Natura 2000 and Urban Atlas
blank at zoom 12. Combining raster and vector WMS layers fixes that scale gap.
The four paired HRL services similarly select 20 m or 100 m using server scale
limits. ArcGIS REST numeric IDs can differ from WMS identifiers; the catalog uses
only identifiers from GetCapabilities.

Evidence: [capabilities snapshot](fixtures/copernicus-capabilities-2026-10-28.json)
and [54 live image samples](fixtures/copernicus-images-2026-10-28.json), covering
Madrid, Guadarrama and Logrono at zooms 9 and 12. Every response decoded as a
256 × 256 image. All nine supported configurations produced nonempty samples at
both zooms. Three individual samples were transparent, consistent with localized
product coverage; availability is not a guarantee of content at every location.
Attribution follows the [official CLMS data policy](https://land.copernicus.eu/en/data-policy).

The combined offline capability tests now cover 104 configurations; five remain
unverified (four ADIF configurations and deprecated RiparianGreen). Five XYZ
configurations have no OGC capabilities. Browser checks exercise real Leaflet
requests, CRS identity, axis order and the paired layers for source and minified
builds; remote images in those browser tests are controlled fixtures. Separate
live image evidence above tests the external services.

The [additional-layer inventory](additional-layers-audit.md) records ten new
variants added after the initial audit, with live image evidence.
