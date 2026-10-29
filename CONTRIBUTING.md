# Contributing

Report a broken layer or propose a new provider through a
[GitHub issue](https://github.com/dieghernan/leaflet-providersESP/issues).
Include the provider name, a reproducible example, the affected location and zoom
level and any browser console or network errors.

For new layers, provide an official service URL, the layer identifier, coverage
and attribution or terms of use. Check its capabilities and sample images before
adding it to the catalog. Preserve existing names when possible and document any
aliases or deprecations.

## Development

Use Node.js 22.13+ (22.x) or Node.js 24 or newer. Install the development
dependencies and Chromium:

``` sh
npm ci
npx playwright install chromium
```

After changing the plugin, regenerate the minified distribution with UglifyJS,
as in leaflet-providers, then run all checks before submitting a change:

``` sh
npm run build
npm test
```

Individual checks are available as `npm run lint`, `npm run test:unit` and
`npm run test:browser`. ESLint checks the JavaScript files and inline scripts in
HTML, following the conventions of
[leaflet-providers](https://github.com/leaflet-extras/leaflet-providers). Use
`npm run lint:fix` to apply automatic formatting fixes. Use
`dev/leaflet-providersESP.js` to try changes locally without modifying `dist/`. The pages in `dev/manual/` load this development copy. See the
[development guide](dev/README.md) for local previews.
`npm run build:check` verifies that `dist/leaflet-providersESP.min.js` is
up to date without rewriting it. This check is also part of `npm test`. Both
distributions pass ESLint's correctness rules; stylistic rules apply to the
editable sources.

Browser tests exercise both the source and minified distributions with Leaflet
1.9.4 in Chromium and check WMS parameters, coordinate axis order, tile loading,
opacity, native zoom limits and compatibility with leaflet-providers in both
script-loading orders. Tile responses are controlled by the tests so remote
service outages do not affect these checks. Use the [live audit
tool](dev/audit/capabilities-audit.md#reproduce-the-checks) to check current provider
availability separately.

The JavaScript checks workflow runs lint and tests on pushes and pull requests
to `main`. On Linux, install browser system dependencies with
`npx playwright install --with-deps chromium`, as the workflow does.

## Documentation and demos

The English README introduces the plugin. The Spanish Jekyll site lives in
`docs/`: `index.md` introduces the project, `guia.md` contains the usage guide and
`preview.html` and `visor.html` share the catalog and map application.

Install Ruby and Bundler, then build the site from `docs/`:

```sh
node -e "require('node:fs').cpSync('dist', 'docs/dist', {recursive: true})"
cd docs
bundle install
bundle exec jekyll build
```

Use `bundle exec jekyll serve` for a local preview. Check the site at its
configured `/leaflet-providersESP/` base path, including narrow mobile screens.
The published site loads the plugin from this checkout through Jekyll's
`/dist/` output. The Pages workflow copies the distribution before building.

Keep the complete README and guide examples working. Browser tests exercise
those examples and the shared map interface with controlled tile responses;
remote availability is checked separately by the live audit.

## Social preview

`dev/social/social-card.html` is the editable 1200 × 630 social card. Its map image,
`dev/social/social-map.jpg`, is a snapshot of the viewer with live IGN tiles.
Keep its attribution visible. Export the card as `docs/assets/social-preview.jpg` at
1200 × 630 and keep the file below 500 KB. Update `_config.yml` if the image
format or dimensions change.

## License and attribution

Contributions are distributed under the [MIT license](LICENSE). Preserve
upstream copyright notices when adapting code from other projects and retain
provider attribution. The map services have their own terms of use.
