/* global L */
const { test, expect } = require('@playwright/test');

test('preview synchronizes lazy miniatures and generates code for selected Spanish layers', async({ page }, testInfo) => {
	if (testInfo.project.name === 'minified') await page.route('**/providers.js', async(route) => route.fulfill({ response: await page.request.get('/providers.min.js') }));
	await page.route('https://**/*', (route) => route.abort());
	const errors = [];
	page.on('pageerror', (error) => errors.push(error.message));
	await page.goto('/preview.html');
	await expect(page.locator('#preview-plugin')).toContainText('IGNBase.Todo');
	await expect(page.getByRole('radio', { name: 'IGNBase.Todo',
		exact: true })).toBeChecked();
	const count = await page.locator('.preview-card').count();
	expect(count).toBeGreaterThan(80);
	await expect(page.locator('.preview-mini.leaflet-container').first()).toBeVisible();
	expect(await page.locator('.preview-mini.leaflet-container').count()).toBeLessThan(12);
	await page.locator('#preview-search').fill('UnidadesAdm.Limites');
	await page.getByRole('checkbox', { name: 'UnidadesAdm.Limites',
		exact: true }).check();
	await expect(page.locator('#preview-plugin')).toContainText('UnidadesAdm.Limites');
	await expect(page.locator('#preview-plugin')).toContainText('IGNBase.Todo');
	const code = await page.locator('#preview-native').textContent();
	const layers = await page.evaluate((code) => {
		const map = L.map(document.createElement('div')).setView([40, -3], 5);
		new Function('map', code)(map);
		let count = 0;
		map.eachLayer(() => count++);
		map.remove();
		return count;
	}, code);
	expect(layers).toBe(2);
	await page.locator('#preview-search').fill('IGNBase.Gris');
	await page.getByRole('radio', { name: 'IGNBase.Gris',
		exact: true }).check();
	await expect(page.locator('#preview-plugin')).not.toContainText('IGNBase.Todo');
	await expect(page.locator('#preview-plugin')).toContainText('UnidadesAdm.Limites');
	await page.setViewportSize({ width: 390,
		height: 844 });
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
	await expect(page.locator('#preview-map')).toBeVisible();
	expect(errors).toEqual([]);
});
