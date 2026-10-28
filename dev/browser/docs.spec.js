/* global L */
const { test, expect } = require('@playwright/test');
const tile = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
test.beforeEach(async({ page }, testInfo) => {
	if (testInfo.project.name === 'minified') await page.route('**/providers.js', async(route) => route.fulfill({ response: await page.request.get('/providers.min.js') }));
	await page.route('https://**/*', (route) => route.fulfill({ contentType: 'image/png',
		body: tile }));
});
test('catalog filters, previews a transparent layer and produces executable Leaflet code', async({ page }) => {
	const errors = [];
	page.on('pageerror', (error) => errors.push(error.message));
	await page.goto('/catalog.html');
	await expect(page.locator('#layer-count')).toContainText('capas');
	await expect(page.locator('#layer-select')).not.toContainText('RiparianGreen');
	await page.locator('#service-filter').selectOption('WMS');
	await page.locator('#type-filter').selectOption('overlay');
	await page.locator('#layer-search').fill('ForestLeaf');
	await page.locator('#layer-select').selectOption('Copernicus.ForestLeaf');
	await expect(page.locator('#active-layers')).toContainText('IGNBase.Gris');
	await expect(page.locator('#active-layers')).toContainText('Copernicus.ForestLeaf');
	await expect(page.locator('#layer-details')).toContainText('2012/2015');
	const code = await page.locator('#native-code').inputValue();
	expect(code).toContain('L.CRS.EPSG4326');
	const result = await page.evaluate((code) => {
		const map = L.map(document.createElement('div')).setView([40, -3], 5);
		const layer = new Function('map', 'return ' + code)(map);
		const crs = layer.options.crs === L.CRS.EPSG4326;
		map.remove();
		return crs;
	}, code);
	expect(result).toBe(true);
	await page.locator('#layer-search').fill('no-such-layer');
	await expect(page.locator('#show-layer')).toBeDisabled();
	await expect(page.locator('#layer-code')).toHaveValue('');
	expect(errors).toEqual([]);
});
test('viewer combines layers and restores opacity and coordinates from the shared URL', async({ page, context }) => {
	await context.grantPermissions(['clipboard-read', 'clipboard-write']);
	await page.goto('/viewer.html');
	await page.locator('#layer-search').fill('UnidadesAdm.Limites');
	await page.locator('#layer-select').selectOption('UnidadesAdm.Limites');
	await page.locator('#show-layer').click();
	const overlay = page.locator('.active-layer').filter({ has: page.getByText('UnidadesAdm.Limites', { exact: true }) });
	await overlay.locator('input[type="range"]').fill('0.4');
	await page.locator('#view-canaries').click();
	await expect(page.locator('#map')).not.toHaveClass(/leaflet-zoom-anim/);
	await page.locator('#share-view').click();
	const url = await page.locator('#share-url').inputValue();
	expect(new URL(url).hash).toContain('zoom=7');
	await page.goto(url);
	const restored = page.locator('.active-layer').filter({ has: page.getByText('UnidadesAdm.Limites', { exact: true }) });
	await expect(restored.locator('input')).toHaveValue('0.4');
	await expect(page.locator('#active-layers')).toContainText('IGNBase.Todo');
	await restored.getByRole('button').click();
	await expect(page.locator('#active-layers')).not.toContainText('UnidadesAdm.Limites');
});
test('service entry points filter correctly and mobile controls fit the viewport', async({ page }) => {
	await page.setViewportSize({ width: 390,
		height: 844 });
	for (const service of ['wms', 'wmts']) {
		await page.goto('/' + service + '.html');
		await expect(page.locator('#service-filter')).toHaveValue(service.toUpperCase());
		const names = await page.locator('#layer-select option').evaluateAll((options) => options.map((option) => option.value));
		const protocols = await page.evaluate((names) => names.map((name) => window.providerOpts(name).url.includes('{x}')), names);
		expect(protocols.every((wmts) => wmts === (service === 'wmts'))).toBe(true);
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
		await expect(page.locator('#map')).toBeVisible();
	}
});
test('tile failures and denied geolocation are explained without an alert', async({ page }) => {
	await page.route('https://**/*', (route) => route.abort());
	await page.addInitScript(() => {
		navigator.geolocation.getCurrentPosition = (success, failure) => failure({ code: 1,
			message: 'denied' });
	});
	await page.goto('/viewer.html');
	await expect(page.locator('#map-status')).toContainText('No se han podido cargar');
	await page.locator('#locate').click();
	await expect(page.locator('#map-status')).toContainText('permisos');
});

test('catalog retains compatibility aliases and native examples preserve cleared zoom limits', async({ page }) => {
	await page.goto('/catalog.html');
	for (const name of ['CaminoDeSantiago.CaminosNordeste', 'CaminoDeSantiago.CaminosCatalanes', 'Geofisica.HazardArea2002', 'Copernicus.RiparianLandCover']) {
		await expect(page.locator('#layer-select option[value="' + name + '"]')).toHaveCount(1);
	}
	await page.locator('#layer-select').selectOption('MDT.CurvasNivel');
	const code = await page.locator('#native-code').inputValue();
	expect(code).toContain('"maxNativeZoom": undefined');
	const options = await page.evaluate((code) => {
		const map = L.map(document.createElement('div')).setView([40, -3], 5);
		const layer = new Function('map', 'return ' + code)(map);
		const options = { maxNativeZoom: layer.options.maxNativeZoom,
			wms: layer instanceof L.TileLayer.WMS };
		map.remove();
		return options;
	}, code);
	expect(options).toEqual({ maxNativeZoom: undefined,
		wms: true });
});

test('preview miniatures select a layer and keep its copyable code at the top', async({ page }) => {
	await page.goto('/catalog.html');
	await expect(page.locator('#copy-code')).toBeInViewport();
	await expect(page.locator('.layer-miniature.leaflet-container').first()).toBeVisible();
	const rendered = await page.locator('.layer-miniature.leaflet-container').count();
	expect(rendered).toBeLessThan(await page.locator('.layer-miniature').count());
	await page.locator('#layer-search').fill('IGNBase.Gris');
	await page.getByRole('button', { name: 'Previsualizar IGNBase.Gris',
		exact: true }).click();
	await expect(page.locator('#layer-code')).toHaveValue('L.tileLayer.providerESP(\'IGNBase.Gris\').addTo(map);');
	await expect(page.getByRole('button', { name: 'Previsualizar IGNBase.Gris',
		exact: true })).toHaveAttribute('aria-pressed', 'true');
	await page.setViewportSize({ width: 390,
		height: 844 });
	await page.goto('/viewer.html');
	await expect(page.locator('#copy-code')).toBeInViewport();
	await expect(page.locator('#layer-code')).toBeInViewport();
});
