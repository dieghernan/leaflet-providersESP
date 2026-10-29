(() => {
	'use strict';
	const status = document.getElementById('map-status');
	if (!window.L || typeof providersESP === 'undefined') {
		status.textContent = 'No se ha podido cargar el mapa. Recarga la página.';
		return;
	}
	const map = L.map('map', { zoomControl: false,
		maxZoom: 22 }).setView([40, -3], 5);
	L.control.zoom({ zoomInTitle: 'Acercar',
		zoomOutTitle: 'Alejar' }).addTo(map);
	const control = L.control.layers({}, {}, { collapsed: true }).addTo(map);
	const toggle = control.getContainer().querySelector('.leaflet-control-layers-toggle');
	toggle.title = 'Mostrar u ocultar capas del mapa'; toggle.setAttribute('aria-label', 'Mostrar u ocultar capas del mapa');
	const badge = document.createElement('span'); badge.className = 'layer-count-badge'; badge.setAttribute('aria-hidden', 'true'); toggle.append(badge);
	const hint = document.createElement('p'); hint.id = 'layers-hint'; hint.className = 'layers-hint'; hint.setAttribute('role', 'tooltip'); hint.hidden = true;
	hint.textContent = 'Aquí puedes cambiar el fondo y mostrar u ocultar transparencias.'; control.getContainer().append(hint);
	let hintShown = false;
	let hintTimer;
	let feedbackTimer;
	let countTimer;
	function hideHint() {
		hint.hidden = true; toggle.removeAttribute('aria-describedby'); window.clearTimeout(hintTimer);
	}
	toggle.addEventListener('click', hideHint);
	const layersPanel = control.getContainer();
	L.DomEvent.off(layersPanel, 'mouseenter mouseleave');
	layersPanel.querySelector('.leaflet-control-layers-list').id = 'leaflet-layer-options';
	toggle.setAttribute('aria-controls', 'leaflet-layer-options'); toggle.setAttribute('aria-expanded', 'false');
	new MutationObserver(() => {
		toggle.setAttribute('aria-expanded', String(layersPanel.classList.contains('leaflet-control-layers-expanded')));
	}).observe(layersPanel, { attributes: true,
		attributeFilter: ['class'] });
	toggle.addEventListener('keydown', (event) => {
		if (event.key === ' ') {
			event.preventDefault(); control.expand();
		}
	});
	const close = document.createElement('button'); close.type = 'button'; close.className = 'layers-close'; close.setAttribute('aria-label', 'Cerrar capas'); close.textContent = '×'; layersPanel.prepend(close);
	function closeLayers() {
		control.collapse(); toggle.focus();
	}
	close.addEventListener('click', closeLayers);
	document.addEventListener('click', (event) => {
		if (!layersPanel.contains(event.target)) control.collapse();
	}, true);
	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && layersPanel.classList.contains('leaflet-control-layers-expanded')) closeLayers();
	});
	const search = document.getElementById('layer-search');
	const service = document.getElementById('service-filter');
	service.value = document.querySelector('.map-app').dataset.service;
	const entries = [];
	const registered = new Map();
	function renderLayerStates() {
		const enabled = entries.filter((entry) => registered.has(entry.name) && map.hasLayer(registered.get(entry.name)));
		for (const entry of entries) {
			const active = enabled.includes(entry);
			entry.row.classList.toggle('is-visible', active); entry.visible.hidden = !registered.has(entry.name);
			entry.visible.textContent = active
				? 'Activa'
				: 'En el selector';
		}
		const loading = enabled.filter((entry) => entry.load?.loading);
		const failed = enabled.filter((entry) => entry.load?.error);
		document.getElementById('map').setAttribute('aria-busy', String(loading.length > 0));
		const message = failed.length
			? 'Error de carga: ' + failed.map((entry) => entry.name).join(', ') + '. Algunas teselas no han podido cargarse.'
			: loading.length
				? 'Cargando ' + loading.length + ' capas…'
				: '';
		const output = document.getElementById('tile-status');
		if (output.textContent !== message) output.textContent = message;
	}
	let currentTab = 'backgrounds';
	const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
		.toLowerCase();
	function register(entry, userAction = false) {
		if (entry.input.checked) {
			const layer = L.tileLayer.providerESP(entry.name);
			entry.load = window.watchLayerStatus(layer, renderLayerStates);
			registered.set(entry.name, layer);
			if (entry.overlay) control.addOverlay(layer, entry.name);
			else control.addBaseLayer(layer, entry.name);
			layer.setZIndex(entry.overlay
				? 1
				: 0);
			if (!entry.overlay) {
				for (const other of entries) {
					const previous = registered.get(other.name);
					if (!other.overlay && previous && previous !== layer && map.hasLayer(previous)) map.removeLayer(previous);
				}
			}
			layer.addTo(map);
		} else {
			const layer = registered.get(entry.name);
			map.removeLayer(layer); control.removeLayer(layer); registered.delete(entry.name);
		}
		document.getElementById('registered-count').textContent = '· ' + registered.size + ' en el selector';
		badge.textContent = registered.size;
		renderLayerStates();
		if (userAction) {
			const feedback = document.getElementById('layer-feedback');
			feedback.textContent = entry.input.checked
				? 'Capa añadida al selector y activada.'
				: 'Capa eliminada del selector.';
			window.clearTimeout(feedbackTimer); feedbackTimer = window.setTimeout(() => {
				feedback.textContent = '';
			}, 2000);
			const count = document.getElementById('registered-count'); count.classList.add('count-updated');
			window.clearTimeout(countTimer); countTimer = window.setTimeout(() => count.classList.remove('count-updated'), 1200);
			if (entry.input.checked && !hintShown) {
				hintShown = true; hint.hidden = false; toggle.setAttribute('aria-describedby', hint.id); hintTimer = window.setTimeout(hideHint, 4000);
			}
		}
		resize();
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
				overlay: Boolean(config.options.transparent || config.options.opacity < 1),
				service: config.url.includes('{x}')
					? 'WMTS'
					: 'WMS' });
		}
	}
	entries.sort((a, b) => a.name.localeCompare(b.name));
	for (const entry of entries) {
		const label = document.createElement('label'); label.className = 'ribbon-layer'; label.title = entry.name;
		const input = document.createElement('input'); input.type = 'checkbox'; input.setAttribute('aria-label', 'Incluir ' + entry.name); entry.input = input;
		const name = document.createElement('span'); name.textContent = entry.name;
		const visible = document.createElement('small'); visible.className = 'layer-visible'; visible.id = 'membership-' + entries.indexOf(entry); visible.hidden = true; entry.visible = visible; input.setAttribute('aria-describedby', visible.id);
		label.append(input, name, visible); entry.row = label;
		document.getElementById(entry.overlay
			? 'overlays-panel'
			: 'backgrounds-panel').append(label);
		input.addEventListener('change', () => register(entry, true));
	}
	map.on('layeradd layerremove', renderLayerStates);
	const ribbon = document.getElementById('viewer-controls');
	ribbon.open = !window.matchMedia('(max-width: 600px)').matches;
	document.getElementById('close-ribbon').addEventListener('click', () => {
		document.getElementById('viewer-controls').open = false;
		document.querySelector('#viewer-controls summary').focus();
	});
	function filter() {
		for (const entry of entries) entry.row.hidden = !normalize(entry.name).includes(normalize(search.value.trim())) || Boolean(service.value && entry.service !== service.value);
		const overlays = currentTab === 'overlays';
		const count = entries.filter((entry) => entry.overlay === overlays && !entry.row.hidden).length;
		document.getElementById('layer-count').textContent = count + (overlays
			? ' transparencias disponibles'
			: ' fondos disponibles');
	}
	function activateTab(name) {
		currentTab = name;
		for (const tab of ['backgrounds', 'overlays']) {
			const selected = tab === name;
			const button = document.getElementById(tab + '-tab'); button.setAttribute('aria-selected', String(selected)); button.tabIndex = selected
				? 0
				: -1;
			document.getElementById(tab + '-panel').hidden = !selected;
		}
		filter();
	}
	for (const tab of ['backgrounds', 'overlays']) {
		const button = document.getElementById(tab + '-tab');
		button.addEventListener('click', () => activateTab(tab));
		button.addEventListener('keydown', (event) => {
			if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
			event.preventDefault();
			const next = event.key === 'Home'
				? 'backgrounds'
				: event.key === 'End'
					? 'overlays'
					: tab === 'backgrounds'
						? 'overlays'
						: 'backgrounds';
			activateTab(next); document.getElementById(next + '-tab').focus();
		});
	}
	search.addEventListener('input', filter); service.addEventListener('change', filter);
	function resize() {
		map.invalidateSize();
		control.getContainer().style.setProperty('--layers-height', Math.max(60, map.getSize().y - 65) + 'px');
	}
	new ResizeObserver(resize).observe(document.getElementById('map'));
	const initial = entries.find((entry) => entry.name === 'IGNBase.Todo');
	initial.input.checked = true; register(initial); status.textContent = '';
	filter();
	const locate = L.control({ position: 'topleft' });
	let position;
	locate.onAdd = () => {
		const container = L.DomUtil.create('div', 'leaflet-bar');
		const button = L.DomUtil.create('button', 'locate-button', container);
		button.type = 'button'; button.id = 'locate'; button.title = 'Localizarme'; button.setAttribute('aria-label', 'Localizarme');
		button.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 1v4m0 14v4M1 12h4m14 0h4"/></svg>';
		L.DomEvent.disableClickPropagation(container); L.DomEvent.disableScrollPropagation(container);
		button.addEventListener('click', () => {
			if (!navigator.geolocation) {
				status.textContent = 'Tu navegador no permite obtener la ubicación.'; return;
			}
			button.disabled = true; button.setAttribute('aria-busy', 'true'); status.textContent = 'Buscando tu ubicación…';
			navigator.geolocation.getCurrentPosition((result) => {
				const center = [result.coords.latitude, result.coords.longitude];
				if (position) map.removeLayer(position);
				position = L.circleMarker(center, { radius: 7,
					color: '#fff',
					weight: 2,
					fillColor: '#0969da',
					fillOpacity: 1 }).addTo(map)
					.bindTooltip('Tu ubicación');
				map.setView(center, 14); status.textContent = 'Ubicación encontrada.'; button.disabled = false; button.removeAttribute('aria-busy');
			}, (error) => {
				status.textContent = error.code === 1
					? 'No has dado permiso para acceder a tu ubicación.'
					: 'No se ha podido obtener tu ubicación. Inténtalo de nuevo.';
				button.disabled = false; button.removeAttribute('aria-busy');
			}, { timeout: 10000,
				maximumAge: 60000 });
		});
		return container;
	};
	locate.addTo(map);
	window.addAddressSearch(map, () => control.collapse());
})();
