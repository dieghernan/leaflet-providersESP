(() => {
	'use strict';
	const status = document.getElementById('map-status');
	if (!window.L || !L.tileLayer.providerESP || typeof providersESP === 'undefined') {
		status.textContent = 'No se ha podido cargar el mapa. Recarga la página para reintentar.';
		return;
	}
	const app = document.querySelector('.map-app');
	const select = document.getElementById('layer-select');
	const search = document.getElementById('layer-search');
	const service = document.getElementById('service-filter');
	const type = document.getElementById('type-filter');
	const saved = new URLSearchParams(window.location.hash.slice(1));
	const catalog = [];
	for (const [provider, definition] of Object.entries(providersESP)) {
		const variants = definition.variants
			? Object.keys(definition.variants)
			: [null];
		for (const variant of variants) {
			if (variant && definition.variants[variant].deprecated) continue;
			const name = variant
				? provider + '.' + variant
				: provider;
			const config = providerOpts(name);
			const overlay = Boolean(config.options.transparent || config.options.opacity < 1);
			catalog.push({ name,
				config,
				service: config.url.includes('{x}')
					? 'WMTS'
					: 'WMS',
				type: overlay
					? 'overlay'
					: 'base' });
		}
	}
	catalog.sort((a, b) => a.name.localeCompare(b.name));
	const byName = new Map(catalog.map((entry) => [entry.name, entry]));
	const map = L.map('map', { zoomControl: false,
		minZoom: 0,
		maxZoom: 22 }).setView([40, -3], 5);
	L.control.zoom({ zoomInTitle: 'Acercar',
		zoomOutTitle: 'Alejar' }).addTo(map);
	L.control.scale({ imperial: false }).addTo(map);
	if (window.GeoSearch) {
		new window.GeoSearch.GeoSearchControl({
			provider: new window.GeoSearch.OpenStreetMapProvider(),
			searchLabel: 'Buscar lugar o dirección',
			notFoundMessage: 'No se han encontrado resultados.',
			autoComplete: false,
			showMarker: false,
			showPopup: false
		}).addTo(map);
	}
	const active = new Map();
	let loading = new Set();
	let failed = new Set();
	let gps;
	function reportTiles() {
		if (failed.size) {
			status.textContent = 'No se han podido cargar algunas teselas de: ' + [...failed].join(', ') + '. Comprueba el servicio o prueba otra capa.';
		} else if (loading.size) {
			status.textContent = 'Cargando: ' + [...loading].join(', ') + '…';
		} else {
			status.textContent = 'Mapa listo. Las capas pueden estar vacías fuera de su cobertura o escala.';
		}
	}
	function remove(name) {
		const layer = active.get(name);
		if (layer) {
			active.delete(name);
			loading.delete(name);
			failed.delete(name);
			map.removeLayer(layer);
		}
	}
	function add(name, opacity) {
		const entry = byName.get(name);
		if (!entry || active.has(name)) return;
		if (entry.type === 'base') {
			for (const current of active.keys()) {
				if (byName.get(current).type === 'base') remove(current);
			}
		}
		const layer = L.tileLayer.providerESP(name);
		if (Number.isFinite(opacity)) layer.setOpacity(Math.min(1, Math.max(0, opacity)));
		active.set(name, layer);
		layer.on('loading', () => {
			if (!active.has(name)) return;
			loading.add(name);
			failed.delete(name);
			reportTiles();
		});
		layer.on('load', () => {
			loading.delete(name);
			reportTiles();
		});
		layer.on('tileerror', () => {
			if (active.has(name)) failed.add(name);
			reportTiles();
		});
		layer.addTo(map);
		// Transparent overlays must remain above an opaque basemap when it changes.
		for (const [current, item] of active) {
			if (byName.get(current).type === 'overlay') item.bringToFront();
		}
	}
	function renderActive() {
		const container = document.getElementById('active-layers');
		container.replaceChildren();
		for (const [name, layer] of active) {
			const row = document.createElement('div');
			row.className = 'active-layer';
			const title = document.createElement('strong');
			title.textContent = name;
			const label = document.createElement('label');
			const range = document.createElement('input');
			range.type = 'range';
			range.min = 0;
			range.max = 1;
			range.step = 0.05;
			range.value = layer.options.opacity;
			const text = document.createElement('span');
			const update = () => {
				text.textContent = 'Opacidad: ' + Math.round(Number(range.value) * 100) + ' %';
			};
			update();
			range.addEventListener('input', () => {
				layer.setOpacity(Number(range.value)); update();
			});
			label.append(text, range);
			const button = document.createElement('button');
			button.type = 'button';
			button.textContent = 'Quitar ' + name;
			button.addEventListener('click', () => {
				remove(name); renderActive(); reportTiles();
			});
			row.append(title, label, button);
			container.append(row);
		}
	}
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
		const properties = Object.entries(options).map(([key, value]) => '    ' + JSON.stringify(key) + ': ' + (value === L.CRS.EPSG4326
			? 'L.CRS.EPSG4326'
			: JSON.stringify(value)));
		return (entry.service === 'WMS'
			? 'L.tileLayer.wms('
			: 'L.tileLayer(') + JSON.stringify(url) + ', {\n' + properties.join(',\n') + '\n}).addTo(map);';
	}
	function describe() {
		highlightPreview();
		const entry = byName.get(select.value);
		const details = document.getElementById('layer-details');
		details.replaceChildren();
		for (const id of ['show-layer', 'fit-layer', 'copy-code', 'copy-native']) document.getElementById(id).disabled = !entry;
		if (!entry) {
			document.getElementById('layer-code').value = '';
			document.getElementById('native-code').value = '';
			return;
		}
		const options = entry.config.options;
		const title = document.createElement('strong');
		title.textContent = entry.name;
		const metadata = document.createElement('dl');
		const data = [
			[
				'Servicio', entry.service + ' · ' + (entry.type === 'base'
					? 'Fondo'
					: 'Superposición')
			],
			['Zoom configurado', (options.minZoom ?? 0) + '–' + (options.maxZoom ?? L.TileLayer.prototype.options.maxZoom)],
			[
				'Cobertura configurada', options.bounds
					? JSON.stringify(options.bounds)
					: 'Sin límite declarado; consulta el servicio.'
			],
			['Servidor', new URL(entry.config.url).hostname]
		];
		if (options.maxNativeZoom !== undefined) data.push(['Zoom nativo máximo', options.maxNativeZoom]);
		for (const [key, value] of data) {
			const term = document.createElement('dt');
			const definition = document.createElement('dd');
			term.textContent = key;
			definition.textContent = value;
			metadata.append(term, definition);
		}
		const attribution = document.createElement('p');
		// Attribution is trusted HTML from the checked-in provider definitions.
		attribution.innerHTML = options.attribution;
		const endpoint = document.createElement('a');
		endpoint.href = entry.config.url;
		endpoint.textContent = 'URL del servicio';
		details.append(title, metadata, attribution, endpoint);
		if (entry.name.startsWith('Copernicus.')) {
			const note = document.createElement('p');
			note.textContent = 'Productos europeos de 2012/2015. La cobertura real depende del producto.';
			details.append(note);
		}
		if (entry.name === 'ADIF') {
			const note = document.createElement('p');
			note.textContent = 'Disponibilidad sin verificar: el servicio devolvió HTTP 403 en la auditoría de octubre de 2026.';
			details.append(note);
		}
		document.getElementById('layer-code').value = 'L.tileLayer.providerESP(\'' + entry.name + '\').addTo(map);';
		document.getElementById('native-code').value = nativeCode(entry);
	}
	const thumbnails = new Map();
	const previews = document.getElementById('layer-previews');
	const previewObserver = new IntersectionObserver((records) => {
		for (const record of records) {
			if (!record.isIntersecting) continue;
			const target = record.target;
			previewObserver.unobserve(target);
			const entry = byName.get(target.dataset.provider);
			const miniature = L.map(target, { zoomControl: false,
				attributionControl: false,
				dragging: false,
				touchZoom: false,
				doubleClickZoom: false,
				scrollWheelZoom: false,
				boxZoom: false,
				keyboard: false });
			thumbnails.set(target, miniature);
			const options = entry.config.options;
			const zoom = Math.max(options.minZoom ?? 0, Math.min(7, options.maxZoom ?? 18));
			miniature.setView(options.bounds
				? L.latLngBounds(options.bounds).getCenter()
				: [40.4166, -3.7038], zoom);
			if (entry.type === 'overlay') L.tileLayer.providerESP('IGNBase.Gris').addTo(miniature);
			const layer = L.tileLayer.providerESP(entry.name).addTo(miniature);
			layer.on('tileerror', () => {
				target.parentElement.dataset.failed = 'true';
			});
		}
	}, { rootMargin: '80px' });
	function highlightPreview() {
		for (const button of previews.querySelectorAll('button')) button.setAttribute('aria-pressed', String(button.dataset.provider === select.value));
	}
	function renderPreviews(entries) {
		previewObserver.disconnect();
		for (const miniature of thumbnails.values()) miniature.remove();
		thumbnails.clear();
		previews.replaceChildren();
		if (app.dataset.mode !== 'catalog') return;
		select.size = 1;
		for (const entry of entries) {
			const button = document.createElement('button');
			button.type = 'button';
			button.className = 'layer-preview';
			button.dataset.provider = entry.name;
			button.setAttribute('aria-label', 'Previsualizar ' + entry.name);
			const miniature = document.createElement('div');
			miniature.className = 'layer-miniature';
			miniature.dataset.provider = entry.name;
			miniature.setAttribute('aria-hidden', 'true');
			const label = document.createElement('strong');
			label.textContent = entry.name;
			const caption = document.createElement('span');
			caption.textContent = entry.service + ' · ' + (entry.type === 'base'
				? 'Fondo'
				: 'Superposición');
			button.append(miniature, label, caption);
			button.addEventListener('click', () => {
				select.value = entry.name;
				describe();
				showSelected();
				if (window.matchMedia('(max-width: 760px)').matches) document.getElementById('selected-title').scrollIntoView({ block: 'start' });
			});
			const credit = document.createElement('div');
			credit.className = 'preview-credit';
			credit.innerHTML = entry.config.options.attribution;
			const item = document.createElement('article');
			item.append(button, credit);
			previews.append(item);
			previewObserver.observe(miniature);
		}
		highlightPreview();
	}
	function filter() {
		const previous = select.value;
		const query = search.value.trim().toLocaleLowerCase('es');
		const entries = catalog.filter((entry) => (!service.value || entry.service === service.value) &&
		  (!type.value || entry.type === type.value) &&
		  (entry.name + ' ' + entry.config.url + ' ' + entry.config.options.attribution).toLocaleLowerCase('es').includes(query));
		select.replaceChildren();
		for (const entry of entries) {
			const option = document.createElement('option');
			option.value = entry.name;
			option.textContent = entry.name;
			select.append(option);
		}
		select.value = entries.some((entry) => entry.name === previous)
			? previous
			: entries[0]?.name || '';
		renderPreviews(entries);
		document.getElementById('layer-count').textContent = entries.length + ' de ' + catalog.length + ' capas. La lista incluye alias compatibles.';
		describe();
	}
	function showSelected() {
		const entry = byName.get(select.value);
		if (!entry) return;
		if (app.dataset.mode === 'catalog') {
			for (const name of [...active.keys()]) remove(name);
			if (entry.type === 'overlay') add('IGNBase.Gris');
		} else if (entry.type === 'overlay' && ![...active.keys()].some((name) => byName.get(name).type === 'base')) {
			add('IGNBase.Gris');
		}
		add(entry.name);
		const zoom = Math.max(entry.config.options.minZoom ?? 0, Math.min(entry.config.options.maxZoom ?? L.TileLayer.prototype.options.maxZoom, map.getZoom()));
		if (zoom !== map.getZoom()) map.setZoom(zoom);
		renderActive();
		reportTiles();
	}
	async function copy(id, message) {
		const field = document.getElementById(id);
		try {
			await navigator.clipboard.writeText(field.value);
			status.textContent = message;
		} catch {
			field.hidden = false;
			field.focus();
			field.select();
			status.textContent = 'Selecciona y copia el texto con el menú de tu dispositivo o Ctrl+C.';
		}
	}
	search.addEventListener('input', filter);
	service.addEventListener('change', filter);
	type.addEventListener('change', filter);
	select.addEventListener('change', () => {
		describe();
		if (app.dataset.mode === 'catalog') showSelected();
	});
	document.getElementById('show-layer').addEventListener('click', showSelected);
	document.getElementById('fit-layer').addEventListener('click', () => {
		const entry = byName.get(select.value);
		if (entry.config.options.bounds) {
			map.fitBounds(entry.config.options.bounds);
			status.textContent = 'Límite configurado de la capa; no garantiza datos en toda la extensión.';
		} else {
			status.textContent = 'Esta capa no declara límites. Desplázate a la zona que quieras consultar.';
		}
	});
	document.getElementById('copy-code').addEventListener('click', () => copy('layer-code', 'Código copiado.'));
	document.getElementById('copy-native').addEventListener('click', () => copy('native-code', 'Código Leaflet copiado.'));
	document.getElementById('view-spain').addEventListener('click', () => map.setView([40, -3], 5));
	document.getElementById('view-canaries').addEventListener('click', () => map.setView([28.3, -15.8], 7));
	document.getElementById('locate').addEventListener('click', () => {
		status.textContent = 'Buscando tu ubicación…';
		map.locate({ setView: true,
			maxZoom: 16 });
	});
	map.on('locationfound', (event) => {
		if (gps) map.removeLayer(gps);
		gps = L.circle(event.latlng, { radius: event.accuracy }).addTo(map);
		status.textContent = 'Ubicación aproximada. Radio de precisión: ' + Math.round(event.accuracy) + ' m.';
	});
	map.on('locationerror', () => {
		status.textContent = 'No se ha podido obtener tu ubicación. Comprueba los permisos del navegador.';
	});
	document.getElementById('share-view').addEventListener('click', () => {
		const center = map.getCenter().wrap();
		const params = new URLSearchParams({ lat: center.lat.toFixed(5),
			lng: center.lng.toFixed(5),
			zoom: map.getZoom() });
		params.set('layers', [...active.keys()].join(','));
		params.set('opacity', [...active.values()].map((layer) => layer.options.opacity).join(','));
		if (select.value) params.set('selected', select.value);
		if (service.value) params.set('service', service.value);
		const url = new URL(window.location.href);
		url.hash = params.toString();
		window.history.replaceState(null, '', url);
		const field = document.getElementById('share-url');
		field.value = url.href;
		field.hidden = false;
		copy('share-url', 'Enlace copiado. Incluye las capas, la opacidad y la vista actual.');
	});
	service.value = ['WMS', 'WMTS'].includes(saved.get('service'))
		? saved.get('service')
		: app.dataset.service;
	filter();
	const savedLayers = saved.has('layers')
		? saved.get('layers').split(',')
			.filter((name) => byName.has(name))
		: ['IGNBase.Todo'];
	const opacity = (saved.get('opacity') || '').split(',');
	savedLayers.forEach((name, index) => add(name, opacity[index]?.trim()
		? Number(opacity[index])
		: undefined));
	if (saved.has('lat') && saved.has('lng') && saved.has('zoom')) {
		const lat = Number(saved.get('lat'));
		const lng = Number(saved.get('lng'));
		const zoom = Number(saved.get('zoom'));
		if (Number.isFinite(lat) && Math.abs(lat) <= 85 && Number.isFinite(lng) && Math.abs(lng) <= 180 && Number.isFinite(zoom) && zoom >= 0 && zoom <= 22) map.setView([lat, lng], zoom);
	}
	const selected = saved.get('selected') || savedLayers[savedLayers.length - 1];
	if (byName.has(selected) && (saved.has('selected') || [...select.options].some((option) => option.value === selected))) {
		if (![...select.options].some((option) => option.value === selected)) {
			service.value = '';
			filter();
		}
		select.value = selected;
		describe();
	}
	renderActive();
	reportTiles();
})();
