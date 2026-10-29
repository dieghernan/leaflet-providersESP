# Local development

Use this directory for experiments without changing the published distribution.
Edit `leaflet-providersESP.js` here to try catalog or plugin changes. The manual
pages load this development copy; `dist/` remains separate. Promote changes to
`dist/leaflet-providersESP.js` deliberately when they are ready, then run
`npm run build` to regenerate the minified distribution.

## Manual previews

From the repository root, start a static server:

```sh
py -m http.server 8000 --bind 127.0.0.1
```

Open <http://127.0.0.1:8000/dev/manual/visual-check.html> to select layers and
inspect live tiles. Its minified option loads `dist/leaflet-providersESP.min.js`
for comparison with the development copy. Stop the server with Ctrl+C.

Other pages in `manual/` preserve focused experiments:

| Page | Purpose |
| --- | --- |
| `minimal.html` | Single-layer example |
| `catalog.html` | Catalog with layer controls and search |
| `minimap.html` | Layer control with minimap previews |
| `external-tiles.html` | Standalone Waze and Strava tile experiment |
| `overlays.html` | Base layers, overlays and location controls |
| `upstream-providers.html` | Combination with upstream leaflet-providers |
| `wmts.html` | WMTS layer controls |

These pages use live services and CDN dependencies. Some experiments depend on
third-party services that may no longer be available.

## Service audits

`audit/` contains the [capabilities report](audit/capabilities-audit.md),
[additional layer inventory](audit/additional-layers-audit.md), audit script and
dated JSON evidence in `audit/fixtures/`. Keep recorded evidence separate from
new audit output. For example, from the repository root:

```sh
py dev/audit/audit-providers.py --source dev/leaflet-providersESP.js --output dev/audit/local-audit.json
```

The script checks `dist/leaflet-providersESP.js` by default. Use `--source` as
above to audit an experiment instead. Live audits require network access.

## Social preview

`social/` contains the editable social card, its map image and a reference HTML
head for social metadata. See [Contributing](../CONTRIBUTING.md#social-preview)
for the image export instructions.

## Existing automated checks

`providers.test.js` and `browser/` check the distribution and website.
`build.js` generates the minified distribution. Run these through the existing
commands in `package.json`; they do not validate the experimental development
copy. The Playwright server in `browser/server.js` serves controlled fixtures
for those checks. Use the static server above for manual experiments.
