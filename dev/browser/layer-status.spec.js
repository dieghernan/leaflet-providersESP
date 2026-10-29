const { test, expect } = require('@playwright/test');
const tile = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');

test.beforeEach(async({ page }, testInfo) => {
	if (testInfo.project.name === 'minified') await page.route('**/providers.js', async(route) => route.fulfill({ response: await page.request.get('/providers.min.js') }));
});

for (const mode of ['viewer', 'preview']) {
	test(mode + ' distinguishes loading, request errors and inactive layers without guessing coverage', async({ page }) => {
		let release;
		const pending = new Promise((resolve) => {
			release = resolve;
		});
		await page.route('https://**/*', async(route) => {
			await pending;
			if (route.request().url()
				.includes('IGNBase-gris')) return route.abort();
			return route.fulfill({ contentType: 'image/png',
				body: tile });
		});
		const viewer = mode === 'viewer';
		const map = page.locator(viewer
			? '#map'
			: '#preview-map');
		const status = page.locator(viewer
			? '#tile-status'
			: '#preview-load-status');
		await page.goto('/' + mode + '.html', { waitUntil: 'domcontentloaded' });
		await expect(status).toContainText('Cargando');
		await expect(map).toHaveAttribute('aria-busy', 'true');
		release();
		await expect(status).toBeEmpty();
		await expect(map).toHaveAttribute('aria-busy', 'false');
		await page.locator(viewer
			? '#layer-search'
			: '#preview-search').fill('IGNBase.Gris');
		await page.getByRole(viewer
			? 'checkbox'
			: 'radio', { name: viewer
			? 'Incluir IGNBase.Gris'
			: 'IGNBase.Gris',
		exact: true }).check();
		await expect(status).toContainText('Error de carga: IGNBase.Gris');
		await expect(map).toHaveAttribute('aria-busy', 'false');
		if (viewer) {
			await page.locator('.leaflet-control-layers-toggle').click();
			await page.locator('.leaflet-control-layers label').filter({ hasText: /^\s*IGNBase.Todo\s*$/ })
				.locator('input')
				.check();
		} else {
			await expect(page.locator('.preview-card').filter({ has: page.getByRole('radio', { name: 'IGNBase.Gris',
				exact: true }) })
				.locator('.preview-tile-status')).toHaveText('Error de carga');
			await page.locator('#preview-search').fill('IGNBase.Todo');
			await page.getByRole('radio', { name: 'IGNBase.Todo',
				exact: true }).check();
		}
		await expect(status).toBeEmpty();
	});
}
