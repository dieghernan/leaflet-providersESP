const { test, expect } = require('@playwright/test');
const tile = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');

test.beforeEach(async({ page }, testInfo) => {
	if (testInfo.project.name === 'minified') await page.route('**/providers.js', async(route) => route.fulfill({ response: await page.request.get('/providers.min.js') }));
	await page.route('https://**/*', (route) => route.fulfill({ contentType: 'image/png',
		body: tile }));
});

async function reset(page) {
	await Promise.all([
		page.waitForEvent('domcontentloaded'),
		page.getByRole('button', { name: 'Restablecer vista inicial',
			exact: true }).click()
	]);
}

test('viewer reset restores layers, map, filters and controls even during an address request', async({ page, context }) => {
	await context.grantPermissions(['geolocation']);
	await context.setGeolocation({ latitude: 40.42,
		longitude: -3.7 });
	const errors = [];
	page.on('pageerror', (error) => errors.push(error.message));
	await page.route('**/geocoder/api/geocoder/candidates?**', async(route) => {
		await new Promise((resolve) => setTimeout(resolve, 500));
		await route.fulfill({ json: [
			{ address: 'Resultado anterior',
				lat: 40,
				lng: -3 }
		] }).catch(() => {});
	});
	await page.goto('/viewer.html');
	const firstTile = await page.locator('#map .leaflet-tile').first()
		.getAttribute('src');
	await page.locator('#locate').click();
	await expect(page.locator('#map-status')).toHaveText('Ubicación encontrada.');
	await expect(page.locator('.leaflet-overlay-pane path')).toHaveCount(1);
	await page.locator('#layer-search').fill('IGNBase.Gris');
	await page.getByRole('checkbox', { name: 'Incluir IGNBase.Gris',
		exact: true }).check();
	await page.getByRole('tab', { name: 'Transparencias' }).click();
	await page.locator('#layer-search').fill('UnidadesAdm.Limites');
	await page.getByRole('checkbox', { name: 'Incluir UnidadesAdm.Limites',
		exact: true }).check();
	await page.locator('.leaflet-control-zoom-in').click();
	await page.locator('#address-toggle').click();
	await page.locator('#address-query').fill('Calle Mayor 1, Madrid');
	await page.locator('#address-form button[type="submit"]').click();
	await expect(page.locator('#address-form')).toHaveAttribute('aria-busy', 'true');
	await reset(page);
	await expect(page.locator('#registered-count')).toContainText('1 en el selector');
	await expect(page.locator('#layer-search')).toHaveValue('');
	await expect(page.locator('#service-filter')).toHaveValue('');
	await expect(page.locator('#backgrounds-tab')).toHaveAttribute('aria-selected', 'true');
	await expect(page.locator('.ribbon-layer input:checked')).toHaveCount(1);
	await expect(page.getByRole('checkbox', { name: 'Incluir IGNBase.Todo',
		exact: true })).toBeChecked();
	await expect(page.locator('#address-panel')).not.toBeVisible();
	await expect(page.locator('#address-query')).toHaveValue('');
	await expect(page.locator('#address-results button')).toHaveCount(0);
	await expect(page.locator('.leaflet-marker-icon, .leaflet-overlay-pane path')).toHaveCount(0);
	await expect(page.locator('#map .leaflet-tile').first()).toHaveAttribute('src', firstTile);
	await page.locator('.leaflet-control-layers-toggle').click();
	await expect(page.locator('.leaflet-control-layers input')).toHaveCount(1);
	await page.getByRole('button', { name: 'Cerrar capas',
		exact: true }).click();
	await page.locator('#address-toggle').click();
	await expect(page.locator('#address-query')).toBeFocused();
	expect(errors).toEqual([]);
});

test('preview reset clears URL filtering, selected layers and code panel state', async({ page }) => {
	await page.goto('/preview.html#filter=IGN');
	await expect(page.locator('#preview-search')).toHaveValue('IGN');
	await page.locator('#preview-search').fill('UnidadesAdm.Limites');
	await page.getByRole('checkbox', { name: 'UnidadesAdm.Limites',
		exact: true }).check();
	await page.locator('#preview-search').fill('IGNBase.Gris');
	await page.getByRole('radio', { name: 'IGNBase.Gris',
		exact: true }).check();
	await page.locator('.leaflet-control-zoom-in').click();
	await page.locator('#preview-info summary').click();
	await page.locator('#preview-search').fill('');
	await page.locator('#preview-list').evaluate((list) => {
		list.scrollTop = 500;
	});
	await reset(page);
	expect(new URL(page.url()).hash).toBe('');
	await expect(page.locator('#preview-search')).toHaveValue('');
	await expect(page.locator('#preview-info details')).toHaveAttribute('open', '');
	await expect(page.locator('#preview-base-active')).toHaveText('Fondo activo: IGNBase.Todo');
	await expect(page.locator('.preview-card input:checked')).toHaveCount(1);
	await expect(page.locator('#preview-plugin')).toHaveText('L.tileLayer.providerESP("IGNBase.Todo").addTo(map);');
	await expect(page.locator('#preview-status')).toBeEmpty();
	await expect(page.locator('#preview-empty')).not.toBeVisible();
	expect(await page.locator('#preview-list').evaluate((list) => list.scrollTop)).toBe(0);
	await page.locator('#preview-search').fill('IGNBase.Gris');
	await page.getByRole('radio', { name: 'IGNBase.Gris',
		exact: true }).check();
	await expect(page.locator('#preview-base-active')).toHaveText('Fondo activo: IGNBase.Gris');
});

test('reset keeps the current service page and mobile ribbon defaults', async({ page }) => {
	await page.setViewportSize({ width: 390,
		height: 844 });
	for (const service of ['wms', 'wmts']) {
		await page.goto('/' + service + '.html');
		await page.locator('#viewer-controls summary').click();
		await page.locator('#service-filter').selectOption('');
		await page.locator('#layer-search').fill('IGN');
		await reset(page);
		expect(new URL(page.url()).pathname).toBe('/' + service + '.html');
		await expect(page.locator('#layer-search')).not.toBeVisible();
		await page.locator('#viewer-controls summary').click();
		await expect(page.locator('#service-filter')).toHaveValue(service.toUpperCase());
		await expect(page.locator('#layer-search')).toHaveValue('');
	}
});
