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
files.set('/docs-example.html', installationExample('docs/index.md'));

http.createServer((request, response) => {
	const file = files.get(request.url);
	if (!file) {
		response.writeHead(404).end();
		return;
	}
	response.writeHead(200, { 'Content-Type': file.contentType });
	response.end(file.body);
}).listen(Number(process.env.LEAFLET_TEST_PORT || 4173), '127.0.0.1');
