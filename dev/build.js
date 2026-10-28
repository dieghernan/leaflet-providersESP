const fs = require('node:fs');
const path = require('node:path');
const UglifyJS = require('uglify-js');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'dist/leaflet-providersESP.js'), 'utf8');
const destination = path.join(root, 'dist/leaflet-providersESP.min.js');
const result = UglifyJS.minify(source, {
	compress: { merge_vars: false },
	mangle: true,
	output: {
		comments: /leaflet-providersESP|MIT License|Adapted from|Copyright \(c\) 2013|BSD 2-Clause|exported/
	}
});

if (result.error) throw result.error;
const output = result.code + '\n';
if (process.argv.includes('--check')) {
	if (!fs.existsSync(destination) || fs.readFileSync(destination, 'utf8').replace(/\r\n/g, '\n') !== output) {
		console.error('The minified distribution is missing or outdated. Run npm run build.');
		process.exitCode = 1;
	}
} else {
	fs.writeFileSync(destination, output);
	console.log(`Built dist/leaflet-providersESP.min.js (${Buffer.byteLength(output)} bytes).`);
}
