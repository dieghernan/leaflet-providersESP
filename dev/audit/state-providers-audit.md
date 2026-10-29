# State providers audit — 2026-10-29

Added 15 providers with 45 named variants. Defaults are aliases of their first variant and do not add distinct layers. PNOAHistorico has 10 variants; all other new providers have fewer than 10.

## Selection

Historical PNOA uses five historical flights (American B, Interministerial, Nacional, OLISTAT and SIGPAC) and five PNOA years (2004, 2009, 2014, 2019 and 2024). These are a compact temporal sample, not complete national snapshots for each year. INE includes sections and districts for 2026 and 2021. SIGPAC exposes recintos, not a separate parcel layer, plus declared crop 2025 and landscape elements advertised by the service.

MTNHistorico uses its advertised GoogleMapsCompatible matrix levels 0–19. Planimetrias and PotencialSolar advertise levels 0–20. WMS providers advertise EPSG:3857 and PNG. GEODE's default combines seven complementary map layers in one named variant.

## Service replacements and sources

The IDEE directory contains obsolete MAPAMA biodiversity URLs which return OGC exceptions. Their replacements were obtained from the [official MITECO biodiversity directory](https://www.miteco.gob.es/es/cartografia-y-sig/ide/directorio_datos_servicios/biodiversidad/wms_bdn.html): Red Natura, ENP, forest uses and livestock routes now use iepnb.gob.es. The alternative geoserver.iepnb.es host returned HTTP 503 during this check.

## Validation and limits

- All 15 live capabilities documents matched the configured identifiers, versions, CRS, formats, WMTS styles and matrix sets. The compact capabilities fixture is used by offline unit tests.
- Requested 158 sample images around Madrid, Valencia, the central peninsula, Albufera, Vega del Jarama and the Cordoba countryside. Image results and exact request URLs are recorded in state-providers-audit.json.
- A Nacional historical-flight request at Valencia returned HTTP 502; the Madrid sample succeeded. One SpainByBike type-of-road request timed out; other samples succeeded.
- Transparent samples can be empty because of location, scale or dataset coverage. GEODE.Cuaternario and the three SIGPAC landscape-element variants had no visible features in the sampled tiles; their capabilities are verified, their visible content remains unconfirmed.
- Opaque pixels do not establish meaningful map content. A contact sheet was visually inspected; it showed historical imagery and maps, flood lines, INE boundaries, slopes, geology, forest uses, cycle routes, solar potential, protected areas, natural paths and livestock routes. The urban SIGPAC sample was blank; countryside samples were also requested. Do not infer complete geographic coverage from these checks.
- Offline browser tests isolate remote tile responses. They verify Leaflet behavior, not remote service availability. Added a browser regression for the historical MTN native zoom ceiling and a unit test for compact selections and default aliases.

## Reproduce

Run `py dev/audit/audit-state-providers.py` with Pillow installed, or use the bundled Codex Python runtime on Windows. The command writes the live audit JSON and returns nonzero when capabilities or image requests fail. No credentials are required. Remote errors can vary between runs.
