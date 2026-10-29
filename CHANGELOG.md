# Unreleased

## Changed

- The map viewer uses a full-page map, a compact navigation strip and a collapsible ribbon with background and transparency tabs. Checked layers are registered in Leaflet's standard layer control without loading tiles until activated there. Code copying stays in Preview. A location button requests geolocation only when clicked. Existing WMS, WMTS and all-provider pages use the same viewer.

- The documentation now separates the introduction, usage guide and contributor instructions.
- A layer reference describes every provider and variant, including default names, compatibility aliases, scale limits and availability observations with their audit dates.
- The preview follows Leaflet Providers' full-map layout, with synchronized, lazy-loaded Spanish layer miniatures, active-layer code with and without the plugin and an initial view centered on Spain. It retains the shared site navigation and uses Spanish labels without a GitHub ribbon. Embedded examples open to a full-window map from their top-right control.

# v1.4.0 - *2026-10-28*

Capabilities and sample images audited on 2026-10-27 and 2026-10-28. Visual review approved by the maintainer on 2026-10-28. See the [audit report](dev/capabilities-audit.md) for evidence, service versions and unresolved services.

## Added

- `IGNBase.Simplificado` adds the simplified street map.
- `Geofisica.EstacionesSismicas`, `HazardArea2015PGA`, `HazardArea2015Isolineas` and `HazardArea2015Intensidad` add seismic stations and the 2015 hazard maps.
- `RedTransporte.Pistas`, `CallesRodaje`, `Plataformas` and `TransporteCable` add airport detail and cable transport links.
- `UnidadesAdm.LimitesHistoricos` adds historical administrative boundaries.

- A reproducible `dist/leaflet-providersESP.min.js` distribution, generated with UglifyJS. The test command checks that it matches the source and runs browser checks against both versions.
- `CaminoDeSantiago.CaminosNordeste` is the preferred name for the current Caminos del Nordeste layer. `CaminosCatalanes` remains an alias for compatibility.
- `Geofisica.HazardArea2002` explicitly names the 2002 NCSE-02 hazard map. `HazardArea` remains an alias for compatibility.

## Deprecated

- `Copernicus.RiparianGreen` is deprecated because its service is unavailable and no equivalent official WMS has been identified. Creating the layer warns once per page. The variant remains callable for compatibility and is excluded from the site's available-layer lists and previews.

## Changed

- `Copernicus` and its eight supported variants use the official EEA WMS 1.3.0 services, preserving their public names and 2012/2015 products. Coverage now follows the European products rather than the retired Spain service. High-resolution layers request both 20 m and 100 m resolutions; Riparian, Natura 2000 and Urban Atlas request raster and vector layers to cover different scales. `ForestLeaf` uses EPSG:4326, including on the default Mercator map, and attribution credits the European Union's Copernicus Land Monitoring Service.

- Use WMS 1.3.0 for the verified services. `Catastro.Catastro` and `Catastro.Parcela` retain WMS 1.1.1; WMTS services retain version 1.0.0. Callers can still override `version`.

## Fixed

- Installation examples include Leaflet 1.9.4, its CSS, script loading order and a map container with an explicit height. CDN examples pin v1.4.0 and distinguish it from the main development branch.
- `CaminoDeSantiago.CaminosCatalanes` now requests the advertised `caminos_nordeste` layer, keeping the existing public variant name.
- `Cartociudad` and `Cartociudad.CodigosPostales` display postal codes from zoom 11 instead of 14, matching nonempty GetMap responses in Madrid and Logrono.
- `Cartociudad.Direcciones` starts at zoom 17 instead of 15, avoiding empty tiles at zooms 15 and 16 in the tested locations.
- `Catastro.Catastro`, `Catastro.Parcela`, `LimitesMaritimos`, `Militar`, `ParquesNaturales` and `PNOA.Mosaico` use verified HTTPS endpoints.
- `Geofisica.HazardArea` requests `HazardArea2002.NCSE-02` (the 2002 NCSE-02 hazard map), replacing the unavailable `NZ.HazardArea` layer.
- `Hidrografia.Subcuencas` uses MITECO's current GeoServer endpoint and its `subcuencas` layer, replacing an endpoint that returned an XML exception.
- `IGNBase`, `LiDAR`, `MDT`, `MTN`, `OcupacionSuelo` and `PNOA` limit native WMTS requests to zoom 20 and allow Leaflet to scale those tiles at higher configured zooms. WMS variants do not inherit this limit.
- `MDT` and `MDT.Relieve` request the advertised WMTS styles, `Elevaciones` and `Default` respectively.
- `MTN` and `OcupacionSuelo` send a single WMTS style parameter. `OcupacionSuelo` requests the advertised style for each layer.
- `providerOpts()` copies catalog options before resolving a layer, preventing provider names, attribution expansion and nested bounds from leaking between layers. Leaflet CRS objects, class instances and caller option precedence are preserved.

## Known issues

- `ADIF` returns HTTP 403 from this audit environment over HTTP and HTTPS. Its availability and supported WMS version remain unverified.
- `Copernicus.RiparianGreen` retains the retired IGN endpoint and remains unavailable, with no identified equivalent official WMS. The other Copernicus variants were migrated and verified on 2026-10-28.

# v1.3.3 - *2023-07-05*

## Added

- IDErioja.Relieve
- IDErioja.Claro
- IDErioja.Oscuro

## Changed
- IDErioja now is IDErioja.Base 


### Checks

- [x] Bump version on script
- [ ] Beautify
- [ ] Lint

# v1.3.2 - *2022-11-14*

Cleanup

## Added

- MDT.SpotElevation
- Geofisica
  -  ObservedEvents, NZ.HazardArea
- VigilanciaVolcanica

## Fixed

- MDT.CurvasNivel
- CaminoDeSantiago updated
- Copernicus updated 



# v1.3.1 - *2022-10-25*

## Fixed

Fix MDT.Relieve

### Checks

- [x] Bump version on script
- [x] Beautify
- [ ] Lint


# v1.3.0 - *2022-02-16*

## Added

- `Catastro`: `BuildingPart, AdministrativeBoundary, AdministrativeUnit`.

## Changed

NA

- [x] Bump version on script
- [x] Beautify
- [x] Lint

# v1.2.0 - *2020-10-26*

## Added

- `Hidrografia`: `POI, ManMade, LineaCosta, Rios, Humedales`.
- `PNOA` : `Mosaico`

## Changed

- `Hidrografia.Cuencas` from IDEE.
- Due to the addition of `PNOA.Mosaico`, previous `PNOA` needs to be called as `PNOA.MaximaActualidad` on the examples only (`PNOA` would still work).

- [x] Bump version on script
- [x] Beautify
- [x] Lint

# v1.1.2 - *2020-10-25*

## Fixed 

- CDN version.


# v1.1.1 - *2020-10-25*

## Fixed 

- Version on script

# v1.1.0 - *2020-10-25*

## Added

- `Hidrografia`: `Cuencas,Subcuencas`
- `Militar`: `CEGETM682, CECAF1M`
- `ADIF`
- `Copernicus`
- `Parques Naturales`
- `LimitesMaritimos`

## Changed

- Refactor of code
- `LPESP_composenames` renamed to `providerOpts`
- Strict mode added, global scope
- Attributions simplified

## Removed

NA

## Fixed

NA

### Checks

- [x] Bump version on script
- [x] Beautify
- [x] Lint


# v1.0.0 - *2020-10-23*

Initial version

## Added

Code and docs

## Changed

NA

## Removed

NA

## Fixed

NA

### Checks

- [x] Bump version on script
- [x] Beautify
- [ ] Lint

