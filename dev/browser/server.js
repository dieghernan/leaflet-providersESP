const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const files = new Map([
	['/', ['dev/browser/fixtures/map.html', 'text/html']],
	['/leaflet.js', ['node_modules/leaflet/dist/leaflet.js', 'text/javascript']],
	['/leaflet.css', ['node_modules/leaflet/dist/leaflet.css', 'text/css']],
	['/upstream.js', ['node_modules/leaflet-providers/leaflet-providers.js', 'text/javascript']],
	['/providers.js', ['dist/leaflet-providersESP.js', 'text/javascript']],
	['/providers.min.js', ['dist/leaflet-providersESP.min.js', 'text/javascript']]
].map(([url, [file, contentType]]) => [
	url, { body: fs.readFileSync(path.join(root, file)),
		contentType }
]));

function installationExample(file) {
	const markdown = fs.readFileSync(path.join(root, file), 'utf8');
	const blocks = [...markdown.matchAll(/```[ \t]*html\r?\n([\s\S]*?)```/g)];
	const example = blocks.find((block) => (/^\s*<!doctype html>/i).test(block[1]));
	if (!example) throw new Error(`Missing complete installation example in ${file}`);
	return { body: example[1],
		contentType: 'text/html' };
}

files.set('/readme-example.html', installationExample('README.md'));
files.set('/docs-example.html', installationExample('docs/guia.md'));


function mapApplication(service = '') {
	const fragment = fs.readFileSync(path.join(root, 'docs/_includes/map-app.html'), 'utf8')
		.replace(/\{\{\s*'([^']*)'\s*\|\s*relative_url\s*\}\}/g, '$1')
		.replace(/\{\{ page\.map_service[^}]*\}\}/g, service)
		.replace(/\{\{ page\.title \}\}/g, 'Visor de mapas');
	return { body: '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/leaflet.css"><link rel="stylesheet" href="/map-app.css"></head><body class="map-page">' + fragment + '<script src="/leaflet.js"></script><script src="/providers.js"></script><script src="/layer-status.js"></script><script src="/address-search.js"></script><script src="/map-app.js"></script></body></html>',
		contentType: 'text/html' };
}
files.set('/viewer.html', mapApplication());
files.set('/wms.html', mapApplication('WMS'));
files.set('/wmts.html', mapApplication('WMTS'));
files.set('/preview.html', { body: '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/leaflet.css"><link rel="stylesheet" href="/preview.css"></head><body class="preview-page">' + fs.readFileSync(path.join(root, 'docs/_includes/preview.html'), 'utf8').replace(/\{\{[^}]+\}\}/g, '/') + '<script src="/leaflet.js"></script><script src="/providers.js"></script><script src="/layer-status.js"></script><script src="/preview.js"></script></body></html>',
	contentType: 'text/html' });
for (const [url, file, contentType] of [
	['/layer-status.js', 'docs/js/layer-status.js', 'text/javascript'],
	['/preview.js', 'docs/js/preview.js', 'text/javascript'],
	['/preview.css', 'docs/assets/css/preview.css', 'text/css'],
	['/address-search.js', 'docs/js/address-search.js', 'text/javascript'],
	['/map-app.js', 'docs/js/map-app.js', 'text/javascript'],
	['/map-app.css', 'docs/assets/css/map-app.css', 'text/css']
]) files.set(url, { body: fs.readFileSync(path.join(root, file)),
	contentType });

http.createServer((request, response) => {
	const file = files.get(request.url);
	if (!file) {
		response.writeHead(404).end();
		return;
	}
	response.writeHead(200, { 'Content-Type': file.contentType });
	response.end(file.body);
}).listen(Number(process.env.LEAFLET_TEST_PORT || 4173), '127.0.0.1');
