import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import html from 'eslint-plugin-html';
import globals from 'globals';

// Follow leaflet-providers' tabs, single quotes, braces and semicolon conventions.
export default [
	{
		ignores: ['node_modules/**', 'docs/_site/**', 'docs/.jekyll-cache/**', 'test-results/**', 'playwright-report/**']
	},
	{
		files: ['**/*.js', '**/*.mjs', '**/*.html'],
		ignores: ['**/*.min.js'],
		plugins: { '@stylistic': stylistic,
			html },
		languageOptions: { ecmaVersion: 'latest' },
		rules: {
			...js.configs.recommended.rules,
			...stylistic.configs.all.rules,
			'@stylistic/dot-location': ['error', 'property'],
			'@stylistic/function-call-argument-newline': ['error', 'consistent'],
			'@stylistic/array-element-newline': ['error', 'consistent'],
			'@stylistic/multiline-comment-style': 'off',
			'@stylistic/padded-blocks': 'off',
			'@stylistic/brace-style': ['error', '1tbs'],
			'@stylistic/comma-dangle': ['error', 'only-multiline'],
			'@stylistic/indent': ['error', 'tab'],
			'@stylistic/object-curly-spacing': ['error', 'always'],
			'@stylistic/no-trailing-spaces': 'error',
			'@stylistic/quotes': ['error', 'single'],
			'@stylistic/quote-props': ['error', 'consistent-as-needed'],
			'@stylistic/semi': ['error', 'always'],
			'@stylistic/space-before-function-paren': ['error', 'never'],
			'no-lonely-if': 'error',
			'no-unused-expressions': ['error', { allowTernary: true }]
		}
	},
	{
		files: ['dist/*.js', 'dev/leaflet-providersESP.js', 'docs/js/*.js', '**/*.html'],
		languageOptions: {
			sourceType: 'script',
			globals: {
				...globals.browser,
				L: 'readonly'
			}
		}
	},
	{
		files: ['docs/js/*.js', '**/*.html'],
		languageOptions: {
			globals: { providersESP: 'readonly',
				providerOpts: 'readonly' }
		}
	},
	{
		files: ['**/*.html', 'docs/js/preview.js'],
		languageOptions: {
			globals: { allnames: 'readonly',
				isIgnored: 'readonly',
				isOverlay: 'readonly' }
		}
	},
	{
		files: ['**/*.html'],
		settings: { 'html/indent': '0' },
		languageOptions: { globals: { providersESPversion: 'readonly' } }
	},
	{
		files: ['dev/**/*.test.js', 'dev/browser/*.js', 'dev/build.js', 'playwright.config.js'],
		languageOptions: { sourceType: 'commonjs',
			globals: { ...globals.node,
				...globals.browser } },
		rules: { 'no-undef': ['error', { typeof: true }] }
	},
	{
		files: ['dist/*.min.js'],
		rules: js.configs.recommended.rules
	},
	{
		files: ['**/*.mjs'],
		languageOptions: { sourceType: 'module',
			globals: globals.node }
	}
];
