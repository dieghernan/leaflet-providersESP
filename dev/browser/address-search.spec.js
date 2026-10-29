const { test, expect } = require('@playwright/test');

test.beforeEach(async({ page }, testInfo) => {
	if (testInfo.project.name === 'minified') await page.route('**/providers.js', async(route) => route.fulfill({ response: await page.request.get('/providers.min.js') }));
	await page.route('https://**/*', (route) => route.abort());
});

test('address control opens rightwards on click and closes with its button or Escape', async({ page }) => {
	let requests = 0;
	page.on('request', (request) => {
		if (request.url().includes('/geocoder/')) requests++;
	});
	await page.goto('/viewer.html');
	const toggle = page.getByRole('button', { name: 'Buscar dirección',
		exact: true });
	await toggle.hover();
	await expect(page.locator('#address-panel')).not.toBeVisible();
	await toggle.click();
	await expect(page.locator('#address-query')).toBeFocused();
	const buttonBounds = await toggle.boundingBox();
	const panelBounds = await page.locator('#address-panel').boundingBox();
	expect(panelBounds.x).toBeGreaterThan(buttonBounds.x + buttonBounds.width);
	expect(requests).toBe(0);
	await page.keyboard.press('Escape');
	await expect(toggle).toBeFocused();
	await expect(toggle).toHaveAttribute('aria-expanded', 'false');
	await toggle.click();
	await page.getByRole('button', { name: 'Cerrar búsqueda',
		exact: true }).click();
	await expect(toggle).toBeFocused();
	await toggle.click();
	await page.locator('#layer-search').click();
	await expect(page.locator('#address-panel')).not.toBeVisible();
});

test('CartoCiudad candidates and find locate an address without changing registered layers', async({ page }) => {
	await page.route('**/geocoder/api/geocoder/candidates?**', (route) => {
		const url = new URL(route.request().url());
		expect(url.searchParams.get('q')).toBe('Calle Mayor 1, Madrid');
		expect(url.searchParams.get('limit')).toBe('5');
		return route.fulfill({ json: [
			{ id: '123',
				type: 'portal',
				address: 'Calle Mayor 1, Madrid',
				lat: 0,
				lng: 0 }
		] });
	});
	await page.route('**/geocoder/api/geocoder/find?**', (route) => {
		const url = new URL(route.request().url());
		expect(url.searchParams.get('id')).toBe('123');
		expect(url.searchParams.get('type')).toBe('portal');
		return route.fulfill({ json: { lat: 40.416,
			lng: -3.703 } });
	});
	await page.goto('/viewer.html');
	await page.locator('#address-toggle').click();
	await page.locator('#address-query').fill('Calle Mayor 1, Madrid');
	await page.locator('#address-form').getByRole('button', { name: 'Buscar',
		exact: true })
		.click();
	await page.locator('#address-results').getByRole('button', { name: 'Calle Mayor 1, Madrid',
		exact: true })
		.click();
	await expect(page.locator('#address-status')).toHaveText('Dirección localizada.');
	await expect(page.locator('.leaflet-popup-content')).toHaveText('Calle Mayor 1, Madrid');
	await expect(page.locator('.leaflet-marker-icon')).toHaveAttribute('alt', 'Dirección localizada');
	await expect(page.locator('#registered-count')).toContainText('1 en el selector');
});

test('address search reports empty or failed responses and ignores stale requests', async({ page }) => {
	await page.route('**/geocoder/api/geocoder/candidates?**', async(route) => {
		const query = new URL(route.request().url()).searchParams.get('q');
		if (query === 'vacío') return route.fulfill({ json: [] });
		if (query === 'error') return route.fulfill({ status: 503 });
		if (query === 'antigua') {
			await new Promise((resolve) => setTimeout(resolve, 500));
			return route.fulfill({ json: [
				{ address: 'Resultado antiguo',
					lat: 40,
					lng: -3 }
			] });
		}
		return route.fulfill({ json: [
			{ address: '<img src=x onerror=alert(1)>',
				lat: 40,
				lng: -3 }
		] });
	});
	await page.goto('/viewer.html');
	await page.locator('#address-toggle').click();
	const query = page.locator('#address-query');
	const submit = page.locator('#address-form').getByRole('button', { name: 'Buscar',
		exact: true });
	await query.fill('vacío'); await submit.click();
	await expect(page.locator('#address-status')).toContainText('No se han encontrado direcciones');
	await query.fill('error'); await submit.click();
	await expect(page.locator('#address-status')).toContainText('No se ha podido completar');
	await query.fill('antigua'); await submit.click();
	await query.fill('nueva'); await submit.click();
	const result = page.locator('#address-results button');
	await expect(result).toHaveText('<img src=x onerror=alert(1)>');
	await expect(page.locator('#address-results img')).toHaveCount(0);
	await result.click();
	await expect(page.locator('#address-status')).toHaveText('Dirección localizada.');
	await expect(page.locator('.leaflet-popup-content img')).toHaveCount(0);
});
