/* global L */
const { test, expect } = require('@playwright/test');

test.beforeEach(async({ page }, testInfo) => {
	if (testInfo.project.name === 'minified') await page.route('**/providers.js', async(route) => route.fulfill({ response: await page.request.get('/providers.min.js') }));
	await page.route('https://**/*', (route) => route.abort());
});

test('preview synchronizes lazy miniatures and generates code for selected Spanish layers', async({ page }) => {
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

test('both copy actions write their corresponding code and restore temporary feedback', async({ page, context }) => {
	await context.grantPermissions(['clipboard-read', 'clipboard-write']);
	await page.goto('/preview.html');
	for (const [buttonId, codeId, label] of [['preview-copy-plugin', 'preview-plugin', 'Copiar código con plugin'], ['preview-copy', 'preview-native', 'Copiar código sin plugin']]) {
		const button = page.locator('#' + buttonId);
		await expect(button).toHaveAttribute('aria-label', label);
		const expected = await page.locator('#' + codeId).textContent();
		await button.click();
		await expect(button).toHaveText('¡Copiado!');
		await expect(page.locator('#preview-status')).toHaveText('Código copiado al portapapeles');
		const copied = await page.evaluate(() => navigator.clipboard.readText());
		expect(copied.replace(/\r\n/g, '\n')).toBe(expected);
		await expect(button).toHaveText(label, { timeout: 3500 });
		await expect(page.locator('#preview-status')).toBeEmpty();
	}
});

test('clipboard failure selects the requested code without claiming it was copied', async({ page }) => {
	await page.addInitScript(() => {
		Object.defineProperty(navigator, 'clipboard', { value: { writeText: async() => {
			throw new Error('denied');
		} } });
	});
	await page.goto('/preview.html');
	for (const [buttonId, codeId] of [['preview-copy-plugin', 'preview-plugin'], ['preview-copy', 'preview-native']]) {
		await page.locator('#' + buttonId).click();
		await expect(page.locator('#preview-status')).toContainText('Código seleccionado.');
		expect(await page.evaluate(() => window.getSelection().toString())).toBe(await page.locator('#' + codeId).textContent());
		await expect(page.locator('#' + buttonId)).toBeEnabled();
		await expect(page.locator('#' + buttonId)).not.toHaveText('¡Copiado!');
	}
});

test('active indicators follow selections and empty search preserves the applied layers', async({ page }) => {
	await page.goto('/preview.html');
	await expect(page.locator('#preview-base-active')).toHaveText('Fondo activo: IGNBase.Todo');
	await page.locator('#preview-search').fill('IGNBase.Gris');
	const gray = page.getByRole('radio', { name: 'IGNBase.Gris',
		exact: true });
	await gray.check();
	await expect(page.locator('.preview-card').filter({ has: gray })
		.locator('.preview-active')).toBeVisible();
	await expect(page.locator('#preview-base-active')).toHaveText('Fondo activo: IGNBase.Gris');
	await page.locator('#preview-search').fill('UnidadesAdm.Limites');
	const overlay = page.getByRole('checkbox', { name: 'UnidadesAdm.Limites',
		exact: true });
	await overlay.check();
	const indicator = page.locator('.preview-card').filter({ has: overlay })
		.locator('.preview-active');
	await expect(indicator).toBeVisible();
	await overlay.uncheck();
	await expect(indicator).not.toBeVisible();
	const code = await page.locator('#preview-plugin').textContent();
	await page.locator('#preview-search').fill('no-such-layer');
	await expect(page.locator('#preview-empty')).toHaveText('No se han encontrado capas con ese nombre.');
	await expect(page.locator('#preview-empty')).toBeVisible();
	await expect(page.locator('#preview-count')).toHaveText(/^0 de \d+ capas$/);
	await expect(page.locator('#preview-plugin')).toHaveText(code);
	await page.locator('#preview-search').fill('');
	await expect(page.locator('#preview-empty')).not.toBeVisible();
	await expect(gray).toBeChecked();
});
