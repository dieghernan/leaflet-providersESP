// Adapted layout and interaction from leaflet-extras/leaflet-providers/preview (BSD-2-Clause).
(() => {
	'use strict';
	const status = document.getElementById('preview-status');
	if (!window.L || typeof providersESP === 'undefined') {
		status.textContent = 'No se ha podido cargar el mapa. Recarga la página.';
		return;
	}
	const map = L.map('preview-map').setView([40, -3], 5);
	map.zoomControl.setPosition('bottomleft');
	map.zoomControl.options.zoomInTitle = 'Acercar';
	map.zoomControl.options.zoomOutTitle = 'Alejar';
	map.zoomControl.remove();
	map.zoomControl.addTo(map);
	const list = document.getElementById('preview-list');
	const search = document.getElementById('preview-search');
	const entries = [];
	const active = new Map();
	const miniatures = new Map();
	const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
		.toLowerCase();
	function nativeCode(entry) {
		const options = { ...entry.config.options };
		delete options.providerName;
		let url = entry.config.url;
		for (const key of Object.keys(options)) {
			if (url.includes('{' + key + '}')) {
				url = url.split('{' + key + '}').join(options[key]);
				delete options[key];
			}
		}
		const properties = Object.entries(options).map(([key, value]) => '\t' + JSON.stringify(key) + ': ' + (value === L.CRS.EPSG4326
			? 'L.CRS.EPSG4326'
			: JSON.stringify(value)));
		return (url.includes('{x}')
			? 'L.tileLayer('
			: 'L.tileLayer.wms(') + JSON.stringify(url) + ', {\n' + properties.join(',\n') + '\n}).addTo(map);';
	}
	function updateCode() {
		const selected = [...active.keys()].map((name) => entries.find((entry) => entry.name === name))
			.sort((a, b) => Number(a.overlay) - Number(b.overlay));
		document.getElementById('preview-plugin').textContent = selected.map((entry) => 'L.tileLayer.providerESP(' + JSON.stringify(entry.name) + ').addTo(map);').join('\n');
		document.getElementById('preview-native').textContent = selected.map(nativeCode).join('\n\n');
		status.textContent = '';
	}
	function choose(entry) {
		if (!entry.overlay) {
			for (const other of entries) {
				if (!other.overlay && active.has(other.name)) {
					map.removeLayer(active.get(other.name)); active.delete(other.name); other.input.checked = false;
				}
			}
			entry.input.checked = true;
		}
		if (entry.input.checked) {
			const layer = L.tileLayer.providerESP(entry.name).addTo(map);
			layer.setZIndex(entry.overlay
				? 2
				: 1);
			active.set(entry.name, layer);
		} else {
			map.removeLayer(active.get(entry.name)); active.delete(entry.name);
		}
		updateCode();
	}
	for (const [provider, definition] of Object.entries(providersESP)) {
		for (const variant of definition.variants
			? Object.keys(definition.variants)
			: [null]) {
			if (definition.deprecated || variant && definition.variants[variant].deprecated) continue;
			const name = variant
				? provider + '.' + variant
				: provider;
			const config = providerOpts(name);
			entries.push({ name,
				config,
				overlay: Boolean(config.options.transparent || config.options.opacity < 1) });
		}
	}
	entries.sort((a, b) => a.name.localeCompare(b.name));
	const observer = new IntersectionObserver((changes) => {
		for (const change of changes) {
			const entry = change.target.entry;
			if (change.isIntersecting) {
				if (miniatures.has(entry.name)) continue;
				const miniature = L.map(entry.canvas, { attributionControl: false,
					zoomControl: false,
					dragging: false,
					touchZoom: false,
					doubleClickZoom: false,
					scrollWheelZoom: false,
					boxZoom: false,
					keyboard: false }).setView(map.getCenter(), map.getZoom());
				if (entry.overlay) L.tileLayer.providerESP('IGNBase.Gris').addTo(miniature);
				L.tileLayer.providerESP(entry.name).addTo(miniature);
				miniatures.set(entry.name, miniature);
			} else if (miniatures.has(entry.name)) {
				miniatures.get(entry.name).remove(); miniatures.delete(entry.name);
			}
		}
	}, { root: list });
	for (const overlay of [false, true]) {
		const heading = document.createElement('h2');
		heading.textContent = overlay
			? 'Superposiciones'
			: 'Fondos';
		list.append(heading);
		for (const entry of entries.filter((item) => item.overlay === overlay)) {
			const card = document.createElement('label'); card.className = 'preview-card'; card.entry = entry;
			const canvas = document.createElement('div'); canvas.className = 'preview-mini'; canvas.setAttribute('aria-hidden', 'true'); entry.canvas = canvas;
			const caption = document.createElement('span'); caption.className = 'preview-label';
			const input = document.createElement('input'); input.type = overlay
				? 'checkbox'
				: 'radio'; input.name = overlay
				? entry.name
				: 'preview-base'; input.setAttribute('aria-label', entry.name); entry.input = input;
			input.addEventListener('change', () => choose(entry));
			const name = document.createElement('span'); name.className = 'preview-name'; name.textContent = entry.name; caption.title = entry.name;
			caption.append(input, name); card.append(canvas, caption); list.append(card); entry.card = card;
			observer.observe(card);
		}
	}
	map.on('moveend', () => {
		for (const miniature of miniatures.values()) miniature.setView(map.getCenter(), map.getZoom(), { animate: false });
	});
	function filter() {
		let count = 0;
		for (const entry of entries) {
			entry.card.hidden = !normalize(entry.name).includes(normalize(search.value.trim()));
			if (!entry.card.hidden) count++;
		}
		document.getElementById('preview-count').textContent = count + ' de ' + entries.length + ' capas';
		for (const heading of list.querySelectorAll('h2')) {
			const overlay = heading.textContent === 'Superposiciones';
			heading.hidden = !entries.some((entry) => entry.overlay === overlay && !entry.card.hidden);
		}
	}
	search.addEventListener('input', filter);
	function readHash() {
		search.value = new URLSearchParams(location.hash.slice(1)).get('filter') || '';
		filter();
	}
	window.addEventListener('hashchange', readHash);
	readHash();
	const initial = entries.find((entry) => entry.name === 'IGNBase.Todo') || entries.find((entry) => !entry.overlay);
	choose(initial);
	document.getElementById('preview-copy').addEventListener('click', async() => {
		try {
			await navigator.clipboard.writeText(document.getElementById('preview-native').textContent);
			status.textContent = 'Código copiado.';
		} catch {
			const selection = window.getSelection(); const range = document.createRange();
			range.selectNodeContents(document.getElementById('preview-native')); selection.removeAllRanges(); selection.addRange(range);
			status.textContent = 'Código seleccionado. Usa la opción Copiar de tu navegador.';
		}
	});
})();
