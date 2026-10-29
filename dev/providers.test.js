// Run with: node --test dev/providers.test.js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../dist/leaflet-providersESP.js'), 'utf8');
const snapshot = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/capabilities-2026-10-27.json'), 'utf8'));

snapshot.services.push(...JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/copernicus-capabilities-2026-10-28.json'), 'utf8')).services);

function load(script = source) {
	const tileLayer = (url, options) => ({ type: 'tiles',
		url,
		options });
	tileLayer.wms = (url, options) => ({ type: 'wms',
		url,
		options });
	const warnings = [];
	const context = {
		L: { CRS: { EPSG4326: { code: 'EPSG:4326' } },
			tileLayer,
			Util: { extend: Object.assign },
			extend: Object.assign },
		console: { warn: (message) => warnings.push(message) },
		warnings
	};
	vm.createContext(context);
	vm.runInContext(script, context);
	return context;
}

test('development demos use the same catalog as the distribution', () => {
	assert.equal(fs.readFileSync(path.join(__dirname, 'leaflet-providersESP.js'), 'utf8'), source);
});

test('layer reference lists every provider and variant including aliases and deprecated layers', () => {
	const context = load();
	const reference = fs.readFileSync(path.join(__dirname, '../docs/capas.md'), 'utf8');
	const names = new Set([...reference.matchAll(/`([^`\n]+)`/g)].map((match) => match[1]));
	for (const [name, definition] of Object.entries(context.providersESP)) {
		for (const id of [name, ...Object.keys(definition.variants || {}).map((variant) => name + '.' + variant)]) {
			assert.ok(names.has(id), 'Missing layer documentation: ' + id);
		}
	}
});

test('all verifiable providers and variants match the recorded capabilities', () => {
	const context = load();
	const unverified = new Set(snapshot.unverified.map((service) => service.endpoint));
	let verified = 0;
	let unavailable = 0;
	for (const [name, provider] of Object.entries(context.providersESP)) {
		for (const id of [name, ...Object.keys(provider.variants || {}).map((variant) => name + '.' + variant)]) {
			const layer = context.L.tileLayer.providerESP(id);
			if (name === 'IDErioja') continue; // XYZ has no OGC capabilities.
			let url = layer.url.replace(/\{(\w+)\}/g, (match, key) => layer.options[key] ?? match);
			url = new URL(url);
			const endpoint = url.origin + url.pathname;
			if (unverified.has(endpoint)) {
				unavailable++;
				continue;
			}
			const service = snapshot.services.find((item) => item.endpoint === endpoint);
			assert.ok(service, id + ': missing capabilities snapshot');
			const identifier = layer.type === 'wms'
				? layer.options.layers
				: url.searchParams.get('layer');
			const advertisedLayers = (layer.type === 'wms'
				? identifier.split(',')
				: [identifier]).map((name) => service.layers.find((item) => item.name === name));
			assert.ok(advertisedLayers.every(Boolean), id + ': layer absent from capabilities');
			const advertised = advertisedLayers[0];
			if (layer.type === 'wms') {
				assert.equal(layer.options.version, service.version, id + ': WMS version');
				assert.equal(layer.options.maxNativeZoom, undefined, id + ': WMS must not inherit WMTS zoom limits');
				for (const item of advertisedLayers) {
					if (layer.options.crs) assert.ok(item.crs.includes(layer.options.crs.code), id + ': explicit CRS support');
					else assert.ok(item.web_mercator, id + ': EPSG:3857 support');
				}
				assert.ok(service.formats.includes(layer.options.format), id + ': WMS image format');
			} else {
				assert.equal(layer.options.maxNativeZoom, 20, id + ': native WMTS zoom limit');
				assert.equal(url.searchParams.get('version'), service.version, id + ': WMTS version');
				assert.ok(advertised.formats.includes(url.searchParams.get('Format')), id + ': WMTS image format');
				assert.equal(url.searchParams.getAll('style').length, 1, id + ': duplicate style parameters');
				assert.ok(advertised.styles.includes(url.searchParams.get('style')), id + ': WMTS style');
				assert.ok(advertised.matrix_sets.includes(url.searchParams.get('tilematrixset')), id + ': tile matrix set');
			}
			verified++;
		}
	}
	assert.equal(verified, 104);
	assert.equal(unavailable, 5); // ADIF and deprecated RiparianGreen; explicitly unresolved.
});

test('Cartociudad keeps postal codes available before street addresses', () => {
	const context = load();
	const codes = context.L.tileLayer.providerESP('Cartociudad.CodigosPostales');
	const addresses = context.L.tileLayer.providerESP('Cartociudad.Direcciones');
	const defaultLayer = context.L.tileLayer.providerESP('Cartociudad');
	assert.equal(codes.options.minZoom, 11);
	assert.equal(defaultLayer.options.minZoom, 11);
	assert.equal(addresses.options.minZoom, 17);
	assert.equal(codes.options.layers, 'codigo-postal');
	assert.equal(addresses.options.layers, 'AD.Address');
});

test('WMS version overrides remain available for existing clients', () => {
	const context = load();
	const custom = context.L.tileLayer.providerESP('Cartociudad', { version: '1.1.1' });
	const standard = context.L.tileLayer.providerESP('Cartociudad');
	assert.equal(custom.options.version, '1.1.1');
	assert.equal(standard.options.version, '1.3.0');
	assert.equal(context.L.tileLayer.providerESP('Catastro').options.version, '1.3.0');
	assert.equal(context.L.tileLayer.providerESP('Catastro.Catastro').options.version, '1.1.1');
	assert.equal(context.L.tileLayer.providerESP('Catastro.Parcela').options.version, '1.1.1');
});

test('explicit variant names and compatibility aliases create equivalent layers', () => {
	const context = load();
	for (const [preferred, alias] of [
		['CaminoDeSantiago.CaminosNordeste', 'CaminoDeSantiago.CaminosCatalanes'],
		['Geofisica.HazardArea2002', 'Geofisica.HazardArea']
	]) {
		const current = context.L.tileLayer.providerESP(preferred, { opacity: 0.5 });
		const previous = context.L.tileLayer.providerESP(alias, { opacity: 0.5 });
		assert.equal(current.type, previous.type);
		assert.equal(current.url, previous.url);
		const currentOptions = { ...current.options };
		const previousOptions = { ...previous.options };
		delete currentOptions.providerName;
		delete previousOptions.providerName;
		assert.deepEqual(currentOptions, previousOptions);
	}
	assert.equal(context.warnings.length, 0);
});

test('RiparianGreen warns once when created and keeps its original configuration', () => {
	const context = load();
	context.providerOpts('Copernicus.RiparianGreen');
	assert.equal(context.warnings.length, 0);
	const first = context.L.tileLayer.providerESP('Copernicus.RiparianGreen');
	const second = context.L.tileLayer.providerESP('Copernicus.RiparianGreen');
	context.L.tileLayer.providerESP('Copernicus.Forest');
	assert.equal(first.type, 'wms');
	assert.equal(first.options.layers, 'Copernicus_RZ_GLE');
	assert.equal(first.url, 'https://servicios.idee.es/wms/copernicus-landservice-spain?');
	assert.equal(first.options.version, '1.1.1');
	assert.equal(first.url, second.url);
	assert.equal('deprecated' in first.options, false);
	assert.equal(context.warnings.length, 1);
	assert.match(context.warnings[0], /Copernicus\.RiparianGreen is deprecated/);
	assert.match(context.warnings[0], /no equivalent official WMS/);
});

test('deprecated layers remain callable without console support', () => {
	const context = load();
	context.console = undefined;
	assert.equal(context.L.tileLayer.providerESP('Copernicus.RiparianGreen').options.layers, 'Copernicus_RZ_GLE');
});

test('site lists exclude deprecated variants and retain supported variant names', () => {
	const context = load();
	vm.runInContext(fs.readFileSync(path.join(__dirname, '../docs/js/shared.js'), 'utf8'), context);
	const names = [];
	context.L.tileLayer.providerESP.eachLayer((name) => names.push(name));
	assert.equal(names.includes('Copernicus.RiparianGreen'), false);
	assert.equal(context.allnames.includes('Copernicus.RiparianGreen'), false);
	assert.ok(names.includes('CaminoDeSantiago.CaminosNordeste'));
	assert.ok(names.includes('CaminoDeSantiago.CaminosCatalanes'));
	assert.ok(names.includes('Geofisica.HazardArea2002'));
	assert.ok(names.includes('Copernicus.RiparianLandCover'));
});

test('resolving every provider leaves a frozen catalog unchanged', () => {
	const context = load();
	const original = JSON.stringify(context.providersESP);
	function freeze(value) {
		if (value && typeof value === 'object') {
			Object.values(value).forEach(freeze);
			Object.freeze(value);
		}
	}
	freeze(context.providersESP);
	for (const [name, definition] of Object.entries(context.providersESP)) {
		context.L.tileLayer.providerESP(name);
		for (const variant of Object.keys(definition.variants || {})) {
			context.L.tileLayer.providerESP(name + '.' + variant);
		}
	}
	assert.equal(JSON.stringify(context.providersESP), original);
});

test('mutating returned bounds cannot change another layer or the catalog', () => {
	const context = load();
	const first = context.L.tileLayer.providerESP('PNOA');
	first.options.bounds[0][0] = 0;
	first.options.bounds.push([0, 0]);
	const next = context.L.tileLayer.providerESP('PNOA.MaximaActualidad');
	assert.equal(next.options.bounds[0][0], 22.173559281306314);
	assert.equal(next.options.bounds.length, 2);
	assert.equal(context.providersESP.PNOA.options.bounds[0][0], 22.173559281306314);
});

test('variant-specific nested options are independent between layers', () => {
	const context = load();
	const first = context.L.tileLayer.providerESP('IGNBase.TodoNoFondo');
	first.options.bounds[1][1] = 100;
	const next = context.L.tileLayer.providerESP('IGNBase.TodoNoFondo');
	assert.equal(next.options.bounds[1][1], 5);
	assert.equal(context.providersESP.IGNBase.variants.TodoNoFondo.options.bounds[1][1], 5);
});

test('attribution expansion and provider names do not leak to later resolutions', () => {
	const context = load();
	const variant = context.L.tileLayer.providerESP('PNOA.MaximaActualidad');
	const standard = context.L.tileLayer.providerESP('PNOA');
	assert.equal(variant.options.providerName, 'PNOA.MaximaActualidad');
	assert.equal(standard.options.providerName, 'PNOA');
	assert.equal(context.providersESP.PNOA.options.attribution, '{attribution.MDT}');
	assert.equal(context.providersESP.PNOA.options.providerName, undefined);
	assert.match(standard.options.attribution, /Infraestructura de Datos Espaciales/);
});

test('caller objects retain their identity and override variant options', () => {
	const context = load();
	const crs = { code: 'EPSG:4326' };
	const options = { crs,
		version: '1.1.1',
		minZoom: 3,
		opacity: 0 };
	const layer = context.L.tileLayer.providerESP('Cartociudad.Direcciones', options);
	assert.equal(layer.options.crs, crs);
	assert.equal(layer.options.version, '1.1.1');
	assert.equal(layer.options.minZoom, 3);
	assert.equal(layer.options.opacity, 0);
	assert.deepEqual(options, { crs,
		version: '1.1.1',
		minZoom: 3,
		opacity: 0 });
});

test('custom catalog options preserve CRS and class instances while copying data', () => {
	const context = load();
	class CustomRenderer {}
	const renderer = new CustomRenderer();
	const crs = { code: 'EPSG:4326' };
	context.providersESP.Custom = {
		url: 'https://example.test/{z}/{x}/{y}.png',
		options: { attribution: 'Example',
			crs,
			renderer,
			bounds: [[27, -19], [44, 5]] }
	};
	const layer = context.L.tileLayer.providerESP('Custom');
	layer.options.bounds[0][0] = 0;
	assert.equal(layer.options.crs, crs);
	assert.equal(layer.options.renderer, renderer);
	assert.equal(context.providersESP.Custom.options.bounds[0][0], 27);
	assert.equal(context.providersESP.Custom.options.providerName, undefined);
});

test('invalid variant resolution leaves the catalog unchanged', () => {
	const context = load();
	const original = JSON.stringify(context.providersESP);
	assert.throws(() => context.providerOpts('PNOA.Unknown'), (error) => error === 'No such variant of PNOA (Unknown)');
	assert.equal(JSON.stringify(context.providersESP), original);
});

test('the minified distribution preserves the complete public catalog and API', () => {
	const full = load();
	const minified = load(fs.readFileSync(path.join(__dirname, '../dist/leaflet-providersESP.min.js'), 'utf8'));
	assert.equal(minified.providersESPversion, full.providersESPversion);
	assert.equal(typeof minified.providerOpts, 'function');
	assert.equal(typeof minified.L.tileLayer.providerESP, 'function');
	const names = Object.entries(full.providersESP).flatMap(([name, definition]) => [name, ...Object.keys(definition.variants || {}).map((variant) => name + '.' + variant)]);
	const expected = names.map((name) => full.L.tileLayer.providerESP(name));
	const actual = names.map((name) => minified.L.tileLayer.providerESP(name));
	assert.deepEqual(JSON.parse(JSON.stringify(actual)), JSON.parse(JSON.stringify(expected)));
	assert.deepEqual(minified.warnings, full.warnings);
});
