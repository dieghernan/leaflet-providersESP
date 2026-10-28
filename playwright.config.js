const { defineConfig } = require('@playwright/test');
const port = Number(process.env.LEAFLET_TEST_PORT || 4173);
const baseURL = 'http://127.0.0.1:' + port;

module.exports = defineConfig({
	testDir: './dev/browser',
	testMatch: '*.spec.js',
	fullyParallel: true,
	forbidOnly: Boolean(process.env.CI),
	retries: 0,
	workers: 2,
	projects: [
		{ name: 'source',
			use: { providerScript: '/providers.js' } },
		{ name: 'minified',
			use: { providerScript: '/providers.min.js' } }
	],
	reporter: 'list',
	use: {
		baseURL,
		browserName: 'chromium',
		headless: true,
		trace: 'retain-on-failure'
	},
	webServer: {
		command: 'node dev/browser/server.js',
		url: baseURL,
		reuseExistingServer: false
	}
});
