# Project structured data

This layer generates the project's SoftwareSourceCode, WebApplication, Dataset
and Service JSON-LD. It does not replace Chulapa's markup or modify the existing
author normalization plugin.

`docs/_data/structured_data.json` holds the shared creator, software metadata,
application settings and cartographic defaults. The MIT software license and
the cartographic reuse licenses remain separate.

`docs/_data/cartographic_datasets.json` describes verified external datasets
and their access services. Add a dataset only after checking its official
metadata, attribution, license and availability in the viewer. Styles are not
separate datasets. Do not invent release dates or versions.

The application and catalog use the same service selection include. WMS and
WMTS views only reference datasets with a matching service; demos retain their
application markup without advertising the whole catalog.

The source code include has full and summary forms. The catalog reuses dataset
and service includes. GetCapabilities describes a service; it is not represented
as a download of the geographic data.

Build from `docs/` with `bundle exec jekyll build`, then run
`py -m unittest discover -s scripts -p test_structured_data.py` from the repo root.
