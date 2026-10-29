/* global L */
const { test: base, expect } = require('@playwright/test');
const test = base.extend({ providerScript: ['/providers.js', { option: true }] });

const transparentTile = Buffer.from(
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
	'base64'
);

for (const example of ['/readme-example.html', '/docs-example.html']) {
	test(`the complete installation example at ${example} displays a map`, async({ page, providerScript }) => {
		const errors = [];
		page.on('pageerror', (error) => errors.push(error.message));
		const resources = new Map([
			['https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css', '/leaflet.css'],
			['https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js', '/leaflet.js'],
			['https://cdn.jsdelivr.net/gh/dieghernan/leaflet-providersESP@v1.5.0/dist/leaflet-providersESP.min.js', providerScript]
		]);
		await page.route('https://cdn.jsdelivr.net/**', async(route) => {
			const resource = resources.get(route.request().url());
			if (!resource) {
				await route.abort();
				return;
			}
			await route.fulfill({ response: await page.request.get(resource) });
		});
		await page.goto(example);
		await expect(page.locator('#map')).toBeVisible();
		await expect(page.locator('.leaflet-tile-loaded').first()).toBeVisible();
		await expect(page.locator('.leaflet-control-attribution')).toContainText('IGN');
		expect(await page.locator('#map').evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThan(200);
		expect(await page.evaluate(() => L.version)).toBe('1.9.4');
		expect(errors).toEqual([]);
	});
}

test.beforeEach(async({ page }) => {
	// Keep the real Leaflet rendering and request code; isolate remote services.
	await page.route('https://**/*', (route) => route.fulfill({ contentType: 'image/png',
		body: transparentTile }));
	await page.goto('/');
});

for (const version of ['1.3.0', '1.1.1']) {
	test(`WMS ${version} uses the correct CRS parameter in Web Mercator`, async({ page, providerScript }) => {
		await page.addScriptTag({ url: providerScript });
		const requested = page.waitForRequest((request) => request.url().startsWith('https://www.cartociudad.es/'));
		await page.evaluate((version) => {
			const map = L.map('map').setView([40.4166, -3.7038], 12);
			L.tileLayer.providerESP('Cartociudad', { version }).addTo(map);
		}, version);
		const params = new URL((await requested).url()).searchParams;
		expect(params.get('version')).toBe(version);
		expect(params.get(version === '1.3.0'
			? 'crs'
			: 'srs')).toBe('EPSG:3857');
		expect(params.has(version === '1.3.0'
			? 'srs'
			: 'crs')).toBe(false);
		expect(params.get('layers')).toBe('codigo-postal');
		expect(params.get('format')).toBe('image/png');
		expect(params.get('transparent')).toBe('true');
	});

	test(`WMS ${version} preserves the required EPSG:4326 axis order`, async({ page, providerScript }) => {
		await page.addScriptTag({ url: providerScript });
		// In Leaflet EPSG:4326, tile (3, 1, 2) covers lon -45..0, lat 0..45.
		const expectedBounds = version === '1.3.0'
			? '0,-45,45,0'
			: '-45,0,0,45';
		const requested = page.waitForRequest((request) => new URL(request.url()).searchParams.get('bbox') === expectedBounds);
		const preservesCrs = await page.evaluate((version) => {
			const map = L.map('map', { crs: L.CRS.EPSG4326 }).setView([22.5, -22.5], 2);
			const layer = L.tileLayer.providerESP('Cartociudad', { version,
				minZoom: 0,
				crs: L.CRS.EPSG4326 });
			layer.addTo(map);
			return layer.options.crs === L.CRS.EPSG4326;
		}, version);
		expect(preservesCrs).toBe(true);
		const params = new URL((await requested).url()).searchParams;
		expect(params.get(version === '1.3.0'
			? 'crs'
			: 'srs')).toBe('EPSG:4326');
		expect(params.get('bbox')).toBe(expectedBounds);
	});
}

test('classic Catastro keeps WMS 1.1.1 after the INSPIRE layer is created', async({ page, providerScript }) => {
	await page.addScriptTag({ url: providerScript });
	const requested = page.waitForRequest((request) => request.url().includes('/Cartografia/WMS/ServidorWMS.aspx'));
	await page.evaluate(() => {
		const map = L.map('map').setView([40.4166, -3.7038], 17);
		L.tileLayer.providerESP('Catastro');
		L.tileLayer.providerESP('Catastro.Catastro').addTo(map);
	});
	const params = new URL((await requested).url()).searchParams;
	expect(params.get('version')).toBe('1.1.1');
	expect(params.get('srs')).toBe('EPSG:3857');
	expect(params.has('crs')).toBe(false);
});

test('a WMS layer loads PNG tiles and applies the caller opacity', async({ page, providerScript }) => {
	await page.addScriptTag({ url: providerScript });
	const result = await page.evaluate(() => new Promise((resolve) => {
		const map = L.map('map').setView([40.4166, -3.7038], 12);
		const layer = L.tileLayer.providerESP('Cartociudad', { opacity: 0.4 });
		layer.once('load', () => resolve({ isWms: layer instanceof L.TileLayer.WMS,
			attribution: map.attributionControl.getContainer().textContent }));
		layer.addTo(map);
	}));
	expect(result.isWms).toBe(true);
	expect(result.attribution).toContain('Cartociudad');
	await expect(page.locator('.leaflet-layer')).toHaveCSS('opacity', '0.4');
	await expect(page.locator('.leaflet-tile-loaded').first()).toBeVisible();
	expect(await page.locator('.leaflet-tile-loaded').first()
		.evaluate((tile) => tile.naturalWidth)).toBe(1);
});

test('zoom 22 requests native WMTS zoom 20 and scales the tiles', async({ page, providerScript }) => {
	await page.addScriptTag({ url: providerScript });
	const requests = [];
	page.on('request', (request) => {
		if (request.url().startsWith('https://www.ign.es/wmts/')) requests.push(request.url());
	});
	const result = await page.evaluate(() => new Promise((resolve) => {
		const map = L.map('map', { maxZoom: 22 }).setView([40.4166, -3.7038], 22);
		const layer = L.tileLayer.providerESP('IGNBase', { maxZoom: 22 });
		layer.once('load', () => resolve({ zoom: map.getZoom(),
			isWms: layer instanceof L.TileLayer.WMS }));
		layer.addTo(map);
	}));
	expect(result).toEqual({ zoom: 22,
		isWms: false });
	expect(requests.length).toBeGreaterThan(0);
	expect(requests.map((url) => new URL(url).searchParams.get('TileMatrix'))).toEqual(Array(requests.length).fill('20'));
	const scale = await page.locator('.leaflet-tile-container').evaluate((container) => new DOMMatrix(getComputedStyle(container).transform).a);
	expect(scale).toBe(4);
});

test('WMS variants do not inherit the native WMTS zoom ceiling', async({ page, providerScript }) => {
	await page.addScriptTag({ url: providerScript });
	const requested = page.waitForRequest((request) => request.url().startsWith('https://servicios.idee.es/wms-inspire/mdt'));
	await page.evaluate(() => {
		const map = L.map('map', { maxZoom: 22 }).setView([40.4166, -3.7038], 22);
		L.tileLayer.providerESP('MDT.CurvasNivel', { maxZoom: 22 }).addTo(map);
	});
	const params = new URL((await requested).url()).searchParams;
	const [west, , east] = params.get('bbox').split(',')
		.map(Number);
	expect(params.get('layers')).toBe('EL.ContourLine');
	expect(params.get('styles')).toBe('');
	expect(east - west).toBeCloseTo(9.5546285356, 5);
	expect(params.has('TileMatrix')).toBe(false);
});

for (const upstreamFirst of [true, false]) {
	test(`both provider plugins coexist when ${upstreamFirst
		? 'upstream'
		: 'ESP'} loads first`, async({ page, providerScript }) => {
		const order = upstreamFirst
			? ['/upstream.js', providerScript]
			: [providerScript, '/upstream.js'];
		await page.addScriptTag({ url: order[0] });
		await page.addScriptTag({ url: order[1] });
		const result = await page.evaluate(() => {
			const map = L.map('map').setView([40.4166, -3.7038], 12);
			const base = L.tileLayer.provider('OpenStreetMap.Mapnik').addTo(map);
			const overlay = L.tileLayer.providerESP('Cartociudad').addTo(map);
			return {
				upstream: base instanceof L.TileLayer.Provider,
				overlay: overlay instanceof L.TileLayer.WMS,
				layers: overlay.wmsParams.layers,
				attribution: map.attributionControl.getContainer().textContent
			};
		});
		expect(result.upstream).toBe(true);
		expect(result.overlay).toBe(true);
		expect(result.layers).toBe('codigo-postal');
		expect(result.attribution).toContain('OpenStreetMap');
		expect(result.attribution).toContain('Cartociudad');
	});
}

for (const [variant, crs, layers] of [
	['Forest', 'EPSG:3857', '0,1'],
	['ForestLeaf', 'EPSG:4326', 'HRL_DominantLeafType_2015'],
	['UrbanAtlas', 'EPSG:3857', 'Land_Use_Raster1402,Land_Use_vector52160']
]) {
	test(`Copernicus.${variant} uses its advertised CRS and scale layers on a Mercator map`, async({ page, providerScript }) => {
		await page.addScriptTag({ url: providerScript });
		const requested = page.waitForRequest((request) => request.url().includes('discomap.eea.europa.eu/'));
		const preservesCrs = await page.evaluate((variant) => {
			const map = L.map('map').setView([40.4166, -3.7038], 12);
			const layer = L.tileLayer.providerESP('Copernicus.' + variant).addTo(map);
			return variant !== 'ForestLeaf' || layer.options.crs === L.CRS.EPSG4326;
		}, variant);
		expect(preservesCrs).toBe(true);
		const params = new URL((await requested).url()).searchParams;
		expect(params.get('version')).toBe('1.3.0');
		expect(params.get('crs')).toBe(crs);
		expect(params.get('layers')).toBe(layers);
		if (crs === 'EPSG:4326') {
			const [south, west, north, east] = params.get('bbox').split(',')
				.map(Number);
			expect(south).toBeGreaterThan(39);
			expect(north).toBeLessThan(42);
			expect(west).toBeGreaterThan(-5);
			expect(east).toBeLessThan(-2);
			expect(south).toBeLessThan(north);
			expect(west).toBeLessThan(east);
		}
		await expect(page.locator('.leaflet-tile-loaded').first()).toBeVisible();
		await expect(page.locator('.leaflet-control-attribution')).toContainText('Copernicus Land Monitoring Service');
	});
}

test('historical MTN tiles stop at their advertised native zoom 19', async({ page, providerScript }) => {
	await page.addScriptTag({ url: providerScript });
	const requested = page.waitForRequest((request) => request.url().startsWith('https://www.ign.es/wmts/primera-edicion-mtn'));
	await page.evaluate(() => {
		const map = L.map('map', { maxZoom: 22 }).setView([40.4166, -3.7038], 22);
		L.tileLayer.providerESP('MTNHistorico.MTN50', { maxZoom: 22 }).addTo(map);
	});
	const params = new URL((await requested).url()).searchParams;
	expect(params.get('TileMatrix')).toBe('19');
	expect(params.get('layer')).toBe('mtn50-edicion1');
	expect(params.get('tilematrixset')).toBe('GoogleMapsCompatible');
});
