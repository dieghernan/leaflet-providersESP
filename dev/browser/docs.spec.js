const { test, expect } = require('@playwright/test');
const tile = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');

test.beforeEach(async({ page }, testInfo) => {
	if (testInfo.project.name === 'minified') await page.route('**/providers.js', async(route) => route.fulfill({ response: await page.request.get('/providers.min.js') }));
	await page.route('https://**/*', (route) => route.fulfill({ contentType: 'image/png',
		body: tile }));
});

test('ribbon registers dormant layers and the standard Leaflet control manages visibility', async({ page }) => {
	const errors = [];
	page.on('pageerror', (error) => errors.push(error.message));
	await page.goto('/viewer.html');
	await expect(page.locator('#registered-count')).toContainText('1 en el selector');
	await expect(page.locator('.leaflet-tile-container')).toHaveCount(1);
	await page.locator('#layer-search').fill('IGNBase.Gris');
	await page.getByRole('checkbox', { name: 'Incluir IGNBase.Gris',
		exact: true }).check();
	await expect(page.locator('#registered-count')).toContainText('2 en el selector');
	await expect(page.locator('.leaflet-tile-container')).toHaveCount(1);
	await page.locator('.leaflet-control-layers-toggle').click();
	const gray = page.locator('.leaflet-control-layers label').filter({ hasText: /^\s*IGNBase.Gris\s*$/ })
		.locator('input');
	await expect(gray).not.toBeChecked();
	await gray.check();
	await expect(page.locator('.leaflet-control-layers label').filter({ hasText: /^\s*IGNBase.Todo\s*$/ })
		.locator('input')).not.toBeChecked();
	await page.getByRole('tab', { name: 'Transparencias' }).click();
	await page.locator('#layer-search').fill('UnidadesAdm.Limites');
	const include = page.getByRole('checkbox', { name: 'Incluir UnidadesAdm.Limites',
		exact: true });
	await include.check();
	await expect(page.locator('.leaflet-tile-container')).toHaveCount(1);
	await page.locator('.leaflet-control-layers-toggle').click();
	const overlay = page.locator('.leaflet-control-layers label').filter({ hasText: /^\s*UnidadesAdm.Limites\s*$/ })
		.locator('input');
	await overlay.check();
	await expect(page.locator('.leaflet-tile-container')).toHaveCount(2);
	await overlay.uncheck();
	await expect(page.locator('.leaflet-tile-container')).toHaveCount(1);
	await include.uncheck();
	await expect(page.locator('.leaflet-control-layers label').filter({ hasText: /^\s*UnidadesAdm.Limites\s*$/ })).toHaveCount(0);
	await expect(page.locator('#registered-count')).toContainText('2 en el selector');
	await expect(page.locator('textarea, #copy-code, #expand-code')).toHaveCount(0);
	expect(errors).toEqual([]);
});

test('ribbon collapses to give space to the map on mobile and landscape', async({ page }) => {
	for (const size of [
		{ width: 390,
			height: 844 }, { width: 844,
			height: 390 }
	]) {
		await page.setViewportSize(size);
		await page.goto('/viewer.html');
		const before = await page.locator('#map').boundingBox();
		await page.locator('#viewer-controls summary').click();
		await expect(page.locator('#layer-search')).not.toBeVisible();
		const after = await page.locator('#map').boundingBox();
		expect(after.height).toBeGreaterThan(before.height + 50);
		expect(after.height).toBeGreaterThan(size.height - 100);
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true);
		await expect(page.getByRole('button', { name: 'Localizarme',
			exact: true })).toBeVisible();
	}
});

test('native stack button opens on click and closes explicitly, with Escape or outside click', async({ page }) => {
	await page.goto('/viewer.html');
	const toggle = page.locator('.leaflet-control-layers-toggle');
	await expect(toggle).toHaveText('');
	await expect(toggle).toHaveCSS('background-image', /layers(?:-2x)?\.png/);
	await toggle.hover();
	await expect(toggle).toHaveAttribute('aria-expanded', 'false');
	await toggle.click();
	await expect(toggle).toHaveAttribute('aria-expanded', 'true');
	await page.getByRole('button', { name: 'Cerrar capas',
		exact: true }).click();
	await expect(toggle).toBeFocused();
	await expect(toggle).toHaveAttribute('aria-expanded', 'false');
	await page.keyboard.press('Space');
	await expect(toggle).toHaveAttribute('aria-expanded', 'true');
	await page.keyboard.press('Escape');
	await expect(toggle).toBeFocused();
	await expect(toggle).toHaveAttribute('aria-expanded', 'false');
	await page.keyboard.press('Enter');
	await expect(toggle).toHaveAttribute('aria-expanded', 'true');
	await page.locator('#layer-search').click();
	await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});

test('service filters and keyboard tabs preserve registered layers', async({ page }) => {
	await page.goto('/wms.html');
	await expect(page.locator('#service-filter')).toHaveValue('WMS');
	await expect(page.getByRole('checkbox', { name: 'Incluir IGNBase.Todo',
		exact: true })).not.toBeVisible();
	await page.getByRole('tab', { name: 'Fondos' }).focus();
	await page.keyboard.press('ArrowRight');
	await expect(page.getByRole('tab', { name: 'Transparencias' })).toBeFocused();
	await expect(page.locator('#overlays-panel')).toBeVisible();
	await page.locator('#layer-search').fill('límites');
	await page.getByRole('checkbox', { name: 'Incluir UnidadesAdm.Limites',
		exact: true }).check();
	await page.locator('#service-filter').selectOption('WMTS');
	await expect(page.locator('#registered-count')).toContainText('2 en el selector');
	await expect(page.locator('.leaflet-control-layers label').filter({ hasText: /^\s*UnidadesAdm.Limites\s*$/ })).toHaveCount(1);
	await page.goto('/wmts.html');
	await expect(page.locator('#service-filter')).toHaveValue('WMTS');
	await expect(page.getByRole('checkbox', { name: 'Incluir IGNBase.Todo',
		exact: true })).toBeVisible();
});

test('geolocation runs only on demand and handles success and permission denial', async({ page, context }) => {
	await context.grantPermissions(['geolocation']);
	await context.setGeolocation({ latitude: 40.42,
		longitude: -3.7 });
	await page.addInitScript(() => {
		window.locationCalls = 0;
		const locate = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
		navigator.geolocation.getCurrentPosition = (...args) => {
			window.locationCalls++; return locate(...args);
		};
	});
	await page.goto('/viewer.html');
	expect(await page.evaluate(() => window.locationCalls)).toBe(0);
	await page.locator('#locate').click();
	await expect(page.locator('#map-status')).toHaveText('Ubicación encontrada.');
	expect(await page.evaluate(() => window.locationCalls)).toBe(1);
	await page.evaluate(() => {
		navigator.geolocation.getCurrentPosition = (success, failure) => failure({ code: 1 });
	});
	await page.locator('#locate').click();
	await expect(page.locator('#map-status')).toContainText('permiso');
	await expect(page.locator('#locate')).toBeEnabled();
});
