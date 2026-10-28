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
	await expect(page.locator('.service-details')).toHaveCount(0);
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
	await page.getByRole('button', { name: 'Seleccionar UnidadesAdm.Limites',
		exact: true }).click();
	await page.locator('#show-layer').click();
	await page.getByRole('tab', { name: /En el mapa/ }).click();
	const overlay = page.locator('.active-layer').filter({ has: page.getByText('UnidadesAdm.Limites', { exact: true }) });
	await overlay.locator('input[type="range"]').fill('0.4');
	await page.locator('#view-canaries').click();
	await expect(page.locator('#map')).not.toHaveClass(/leaflet-zoom-anim/);
	await page.locator('#share-view').click();
	const url = await page.locator('#share-url').inputValue();
	expect(new URL(url).hash).toContain('zoom=7');
	await page.goto(url);
	await page.getByRole('tab', { name: /En el mapa/ }).click();
	const restored = page.locator('.active-layer').filter({ has: page.getByText('UnidadesAdm.Limites', { exact: true }) });
	await expect(restored.locator('input[type=range]')).toHaveValue('0.4');
	await expect(page.locator('#active-layers')).toContainText('IGNBase.Todo');
	await restored.getByRole('button', { name: 'Quitar UnidadesAdm.Limites',
		exact: true }).click();
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

test('viewer search selects a layer before adding it and exposes both code formats', async({ page, context }) => {
	await context.grantPermissions(['clipboard-read', 'clipboard-write']);
	await page.goto('/viewer.html');
	await expect(page.locator('.catalog-selector')).toBeHidden();
	await page.locator('#layer-search').fill('límites administrativos');
	await page.getByRole('button', { name: 'Seleccionar UnidadesAdm.Limites',
		exact: true }).click();
	await expect(page.locator('#selection-status')).toContainText('Todavía no está');
	await expect(page.locator('#active-count')).toHaveText('1');
	await page.getByRole('button', { name: 'Añadir al mapa',
		exact: true }).click();
	await expect(page.locator('#active-count')).toHaveText('2');
	await expect(page.getByRole('button', { name: 'En el mapa ✓',
		exact: true })).toBeDisabled();
	await page.locator('#code-format').selectOption('native');
	await expect(page.locator('#layer-code')).toHaveValue(/^L.tileLayer.wms/);
	await page.locator('#copy-code').click();
	expect((await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, '\n')).toBe(await page.locator('#layer-code').inputValue());
	await page.locator('#layer-search').fill('no existe ninguna capa');
	await expect(page.locator('#layer-results')).toHaveText('No hay capas con estos filtros.');
	await page.locator('#clear-filters').click();
	await page.locator('#layer-search').fill('ortofoto');
	await expect(page.getByRole('button', { name: 'Seleccionar PNOA.MaximaActualidad',
		exact: true })).toBeVisible();
});
test('mobile panel closes after adding and its code dialog restores keyboard focus', async({ page }) => {
	await page.setViewportSize({ width: 390,
		height: 844 });
	await page.goto('/viewer.html');
	await expect(page.locator('#layers-panel')).toBeHidden();
	await expect(page.locator('#map')).toBeInViewport();
	await page.locator('#open-panel').click();
	await expect(page.locator('#open-panel')).toHaveAttribute('aria-expanded', 'true');
	await expect(page.locator('#layer-search')).toBeFocused();
	await page.locator('#layer-search').fill('UnidadesAdm.Limites');
	await page.getByRole('button', { name: 'Seleccionar UnidadesAdm.Limites',
		exact: true }).click();
	await page.locator('#show-layer').click();
	await expect(page.locator('#layers-panel')).toBeHidden();
	await expect(page.locator('#open-panel')).toBeFocused();
	await expect(page.locator('#mobile-count')).toHaveText('2');
	await page.locator('#mobile-code').click();
	await expect(page.getByRole('dialog')).toBeVisible();
	await page.locator('#dialog-code-format').selectOption('native');
	await expect(page.locator('#expanded-code')).toContainText('L.tileLayer.wms');
	await page.keyboard.press('Escape');
	await expect(page.getByRole('dialog')).toBeHidden();
	await expect(page.locator('#mobile-code')).toBeFocused();
	await page.locator('#open-panel').click();
	await page.keyboard.press('Escape');
	await expect(page.locator('#open-panel')).toBeFocused();
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('hidden layers preserve opacity and layer order in a shared view', async({ page, context }) => {
	await context.grantPermissions(['clipboard-read', 'clipboard-write']);
	await page.goto('/viewer.html');
	await page.locator('#layer-search').fill('UnidadesAdm.Limites');
	await page.getByRole('button', { name: 'Seleccionar UnidadesAdm.Limites',
		exact: true }).click();
	await page.locator('#show-layer').click();
	await page.locator('#layer-search').fill('NombresGeograficos');
	await page.getByRole('button', { name: 'Seleccionar NombresGeograficos',
		exact: true }).click();
	await page.locator('#show-layer').click();
	await page.getByRole('tab', { name: /En el mapa/ }).click();
	await page.getByRole('slider', { name: 'Opacidad de UnidadesAdm.Limites',
		exact: true }).fill('0.4');
	await page.getByRole('checkbox', { name: 'Mostrar UnidadesAdm.Limites',
		exact: true }).uncheck();
	await page.getByRole('button', { name: 'Subir UnidadesAdm.Limites',
		exact: true }).click();
	await page.locator('#share-view').click();
	const url = await page.locator('#share-url').inputValue();
	expect(new URLSearchParams(new URL(url).hash.slice(1)).get('layers')).toBe('IGNBase.Todo,NombresGeograficos,UnidadesAdm.Limites');
	await page.goto(url);
	await page.getByRole('tab', { name: /En el mapa/ }).click();
	await expect(page.getByRole('checkbox', { name: 'Mostrar UnidadesAdm.Limites',
		exact: true })).not.toBeChecked();
	await expect(page.getByRole('slider', { name: 'Opacidad de UnidadesAdm.Limites',
		exact: true })).toHaveValue('0.4');
	await expect(page.locator('.active-layer').nth(1)).toContainText('UnidadesAdm.Limites');
});

test('code remains selectable in its dialog when clipboard access fails', async({ page }) => {
	await page.addInitScript(() => {
		Object.defineProperty(navigator, 'clipboard', { value: { writeText: async() => {
			throw new Error('Clipboard unavailable');
		} } });
	});
	await page.goto('/viewer.html');
	await page.locator('#expand-code').click();
	await page.locator('#dialog-code-format').selectOption('native');
	await page.locator('#copy-native').click();
	await expect(page.locator('#code-dialog-caption')).toContainText('El código está seleccionado');
	expect(await page.evaluate(() => window.getSelection().toString())).toBe(await page.locator('#expanded-code').textContent());
	await page.keyboard.press('Escape');
	await expect(page.locator('#expand-code')).toBeFocused();
});

test('fullscreen falls back to the full window and exits with Escape', async({ page }) => {
	await page.addInitScript(() => {
		HTMLElement.prototype.requestFullscreen = async() => {
			throw new Error('Fullscreen unavailable');
		};
	});
	await page.goto('/viewer.html');
	await page.getByRole('button', { name: 'Pantalla completa',
		exact: true }).click();
	await expect(page.locator('.map-app')).toHaveClass(/map-expanded/);
	await expect(page.getByRole('button', { name: 'Salir de pantalla completa',
		exact: true })).toHaveAttribute('aria-pressed', 'true');
	await expect(page.locator('#map')).toBeInViewport();
	await expect(page.locator('#copy-code')).toBeInViewport();
	await page.keyboard.press('Escape');
	await expect(page.locator('.map-app')).not.toHaveClass(/map-expanded/);
	await expect(page.getByRole('button', { name: 'Pantalla completa',
		exact: true })).toBeFocused();
});
test('undo restores a hidden layer with its opacity and stack position', async({ page }) => {
	await page.goto('/viewer.html#layers=IGNBase.Todo,UnidadesAdm.Limites,NombresGeograficos&opacity=1,0.4,1&hidden=UnidadesAdm.Limites');
	await page.getByRole('tab', { name: /En el mapa/ }).click();
	await page.getByRole('button', { name: 'Quitar UnidadesAdm.Limites',
		exact: true }).click();
	await expect(page.locator('#undo-message')).toHaveText('UnidadesAdm.Limites quitada.');
	await expect(page.locator('#active-count')).toHaveText('2');
	await page.getByRole('button', { name: 'Deshacer',
		exact: true }).click();
	await expect(page.locator('#active-count')).toHaveText('3');
	await expect(page.getByRole('checkbox', { name: 'Mostrar UnidadesAdm.Limites',
		exact: true })).not.toBeChecked();
	await expect(page.getByRole('checkbox', { name: 'Mostrar UnidadesAdm.Limites',
		exact: true })).toBeFocused();
	await expect(page.getByRole('slider', { name: 'Opacidad de UnidadesAdm.Limites',
		exact: true })).toHaveValue('0.4');
	await expect(page.locator('.active-layer').nth(1)).toContainText('NombresGeograficos');
	await expect(page.locator('.active-layer').nth(2)).toContainText('UnidadesAdm.Limites');
	await expect(page.locator('#map .leaflet-tile-pane > .leaflet-layer')).toHaveCount(2);
	await expect(page.locator('#undo-notice')).toBeHidden();
});
test('failed tiles can be retried without showing service details or bounds', async({ page }) => {
	let failing = true;
	await page.route('https://**/*', (route) => {
		if (failing) return route.abort();
		return route.fulfill({ contentType: 'image/png',
			body: tile });
	});
	await page.goto('/viewer.html');
	await expect(page.getByRole('button', { name: 'Reintentar carga',
		exact: true })).toBeVisible();
	failing = false;
	await page.getByRole('button', { name: 'Reintentar carga',
		exact: true }).click();
	await expect(page.locator('#map .leaflet-tile-loaded').first()).toBeVisible();
	await expect(page.locator('#retry-layers')).toBeHidden();
	await expect(page.locator('#map-status')).toContainText('Mapa listo');
	await expect(page.locator('.service-details, #layer-details, #fit-layer')).toHaveCount(0);
});
