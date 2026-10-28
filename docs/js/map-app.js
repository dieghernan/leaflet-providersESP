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
	const viewer = app.dataset.mode === 'viewer';
	const hiddenLayers = new Set();
	const codeFormat = document.getElementById('code-format');
	const selectionStatus = document.getElementById('selection-status');
	const mobile = window.matchMedia('(max-width: 760px)');
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
	function previewOrder(entry) {
		if (entry.name === 'IGNBase.Todo') return 0;
		if (entry.name.startsWith('IGNBase.')) return 1;
		if (entry.name.startsWith('PNOA.')) return 2;
		return 3;
	}
	catalog.sort((a, b) => previewOrder(a) - previewOrder(b) || a.name.localeCompare(b.name));
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
	let expanded = false;
	let nativeExpanded = false;
	let fullscreenButton;
	function setExpanded(value) {
		expanded = value;
		app.classList.toggle('map-expanded', value);
		document.documentElement.classList.toggle('map-expanded-page', value);
		fullscreenButton.setAttribute('aria-pressed', String(value));
		fullscreenButton.setAttribute('aria-label', value
			? 'Salir de pantalla completa'
			: 'Pantalla completa');
		fullscreenButton.title = value
			? 'Salir de pantalla completa'
			: 'Pantalla completa';
		window.requestAnimationFrame(() => map.invalidateSize());
		if (!value) fullscreenButton.focus();
	}
	const fullscreenControl = L.control({ position: 'topright' });
	fullscreenControl.onAdd = () => {
		const container = L.DomUtil.create('div', 'leaflet-bar');
		fullscreenButton = L.DomUtil.create('button', 'map-fullscreen', container);
		fullscreenButton.type = 'button'; fullscreenButton.id = 'toggle-fullscreen';
		fullscreenButton.setAttribute('aria-label', 'Pantalla completa'); fullscreenButton.setAttribute('aria-pressed', 'false'); fullscreenButton.title = 'Pantalla completa';
		fullscreenButton.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></svg>';
		L.DomEvent.disableClickPropagation(container); L.DomEvent.disableScrollPropagation(container);
		fullscreenButton.addEventListener('click', async() => {
			if (expanded) {
				if (document.fullscreenElement === app) await document.exitFullscreen();
				else setExpanded(false);
				return;
			}
			if (app.requestFullscreen) {
				try {
					await app.requestFullscreen(); nativeExpanded = true; setExpanded(true);
				} catch {
					nativeExpanded = false; setExpanded(true);
				}
			} else setExpanded(true);
		});
		return container;
	};
	if (viewer) fullscreenControl.addTo(map);
	document.addEventListener('fullscreenchange', () => {
		if (document.fullscreenElement === app) {
			nativeExpanded = true; setExpanded(true);
		} else if (nativeExpanded) {
			nativeExpanded = false; setExpanded(false);
		}
	});
	const active = new Map();
	let loading = new Set();
	let failed = new Set();
	let gps;
	let removedLayer;
	function reportTiles() {
		updateLayerStatuses();
		updateSelectionStatus();
		document.getElementById('retry-layers').hidden = failed.size === 0;
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
			hiddenLayers.delete(name);
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
		if (entry.type === 'base') {
			const overlays = [...active].filter(([key]) => key !== name);
			active.clear(); active.set(name, layer);
			for (const [key, overlay] of overlays) active.set(key, overlay);
		}
		layer.on('loading', () => {
			if (!active.has(name) || hiddenLayers.has(name)) return;
			loading.add(name);
			failed.delete(name);
			reportTiles();
		});
		layer.on('load', () => {
			loading.delete(name);
			reportTiles();
		});
		layer.on('tileerror', () => {
			if (active.has(name) && !hiddenLayers.has(name)) failed.add(name);
			reportTiles();
		});
		layer.addTo(map);
		// Transparent overlays must remain above an opaque basemap when it changes.
		for (const [current, item] of active) {
			if (byName.get(current).type === 'overlay') item.bringToFront();
		}
	}
	document.getElementById('undo-remove').addEventListener('click', () => {
		if (!removedLayer) return;
		const snapshot = removedLayer;
		add(snapshot.name, snapshot.opacity);
		if (snapshot.hidden) {
			hiddenLayers.add(snapshot.name); map.removeLayer(active.get(snapshot.name)); loading.delete(snapshot.name); failed.delete(snapshot.name);
		}
		const entries = [...active];
		const index = entries.findIndex(([name]) => name === snapshot.name);
		const [restored] = entries.splice(index, 1);
		entries.splice(Math.min(snapshot.index, entries.length), 0, restored);
		// Basemaps always remain below the restored overlay stack.
		entries.sort(([a], [b]) => Number(byName.get(a).type === 'overlay') - Number(byName.get(b).type === 'overlay'));
		active.clear();
		for (const [name, layer] of entries) active.set(name, layer);
		removedLayer = undefined;
		document.getElementById('undo-notice').hidden = true;
		syncStack(); renderActive(); describe(); reportTiles();
		activateTab('active');
		if (mobile.matches) setPanelOpen(true);
		document.querySelector('.active-layer[data-provider="' + snapshot.name + '"] input[type="checkbox"]').focus();
	});
	document.getElementById('dismiss-undo').addEventListener('click', () => {
		removedLayer = undefined; document.getElementById('undo-notice').hidden = true; document.getElementById('map').focus();
	});
	document.getElementById('retry-layers').addEventListener('click', () => {
		const names = [...failed]; failed.clear();
		for (const name of names) if (active.has(name) && !hiddenLayers.has(name)) active.get(name).redraw();
		reportTiles();
		document.getElementById('map').focus();
	});
	function updateLayerStatuses() {
		for (const row of document.querySelectorAll('.active-layer')) {
			const name = row.dataset.provider;
			row.querySelector('.layer-state').textContent = hiddenLayers.has(name)
				? 'Oculta'
				: failed.has(name)
					? 'Algunas teselas no disponibles'
					: loading.has(name)
						? 'Cargando…'
						: 'Lista';
		}
	}
	function syncStack() {
		let index = 1;
		for (const [name, layer] of active) layer.setZIndex(byName.get(name).type === 'base'
			? 0
			: index++);
	}
	function moveLayer(name, direction) {
		const entries = [...active];
		const index = entries.findIndex(([key]) => key === name);
		const target = index + direction;
		if (target < 0 || target >= entries.length || byName.get(entries[target][0]).type === 'base') return;
		[entries[index], entries[target]] = [entries[target], entries[index]];
		active.clear();
		for (const [key, layer] of entries) active.set(key, layer);
		syncStack();
		renderActive();
	}
	function renderActive() {
		const container = document.getElementById('active-layers');
		container.replaceChildren();
		document.getElementById('active-count').textContent = active.size;
		document.getElementById('mobile-count').textContent = active.size;
		if (!active.size) container.textContent = 'No hay capas en el mapa. Añade una desde Explorar.';
		const entries = [...active].filter(([name]) => byName.get(name).type === 'base').concat([...active].filter(([name]) => byName.get(name).type === 'overlay').reverse());
		let previousKind;
		for (const [name, layer] of entries) {
			const layerKind = byName.get(name).type;
			if (layerKind !== previousKind) {
				const heading = document.createElement('h3'); heading.textContent = layerKind === 'base'
					? 'Fondo'
					: 'Superposiciones · de arriba abajo'; container.append(heading); previousKind = layerKind;
			}
			const row = document.createElement('div');
			row.className = 'active-layer';
			row.dataset.provider = name;
			const title = document.createElement('strong');
			title.textContent = name;
			const kind = document.createElement('small');
			kind.textContent = byName.get(name).type === 'base'
				? 'Fondo'
				: 'Superposición';
			const visibility = document.createElement('label');
			const check = document.createElement('input');
			check.type = 'checkbox';
			check.checked = !hiddenLayers.has(name);
			check.setAttribute('aria-label', 'Mostrar ' + name);
			check.addEventListener('change', () => {
				if (check.checked) {
					hiddenLayers.delete(name); layer.addTo(map); syncStack();
				} else {
					hiddenLayers.add(name); loading.delete(name); failed.delete(name); map.removeLayer(layer);
				}
				reportTiles();
			});
			visibility.append(check, document.createTextNode(' Visible'));
			const label = document.createElement('label');
			const range = document.createElement('input');
			range.type = 'range'; range.min = 0; range.max = 1; range.step = 0.05;
			range.value = layer.options.opacity;
			range.setAttribute('aria-label', 'Opacidad de ' + name);
			const text = document.createElement('span');
			const update = () => {
				text.textContent = 'Opacidad: ' + Math.round(Number(range.value) * 100) + ' %'; range.setAttribute('aria-valuetext', Math.round(Number(range.value) * 100) + ' %');
			};
			update();
			range.addEventListener('input', () => {
				layer.setOpacity(Number(range.value)); update(); renderCode();
			});
			label.append(text, range);
			const state = document.createElement('p'); state.className = 'layer-state';
			const buttons = document.createElement('div'); buttons.className = 'layer-row-actions';
			const removeButton = document.createElement('button');
			removeButton.type = 'button'; removeButton.textContent = 'Quitar'; removeButton.setAttribute('aria-label', 'Quitar ' + name);
			removeButton.addEventListener('click', () => {
				removedLayer = { name,
					opacity: layer.options.opacity,
					hidden: hiddenLayers.has(name),
					index: [...active.keys()].indexOf(name) };
				remove(name); renderActive(); describe(); reportTiles();
				document.getElementById('undo-message').textContent = name + ' quitada.';
				document.getElementById('undo-notice').hidden = false;
				document.getElementById('active-tab').focus();
			});
			if (byName.get(name).type === 'overlay') {
				for (const [caption, direction] of [['Subir', 1], ['Bajar', -1]]) {
					const button = document.createElement('button'); button.type = 'button'; button.textContent = caption; button.setAttribute('aria-label', caption + ' ' + name);
					const entries = [...active.keys()]; const adjacent = entries[entries.indexOf(name) + direction];
					button.disabled = !adjacent || byName.get(adjacent).type === 'base';
					button.addEventListener('click', () => {
						moveLayer(name, direction); document.querySelector('.active-layer[data-provider="' + name + '"] button[aria-label="' + caption + ' ' + name + '"]').focus();
					});
					buttons.append(button);
				}
			}
			buttons.append(removeButton);
			row.append(title, kind, visibility, label, state, buttons);
			container.append(row);
		}
		updateLayerStatuses();
		updateAddButton();
		updateResultSelection();
	}
	function nativeCode(entry) {
		const options = { ...entry.config.options };
		delete options.providerName;
		if (active.has(entry.name)) options.opacity = active.get(entry.name).options.opacity;
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
		for (const id of ['show-layer', 'copy-code', 'copy-native', 'expand-code', 'mobile-copy', 'mobile-code']) document.getElementById(id).disabled = !entry;
		if (!entry) {
			document.getElementById('layer-code').value = '';
			document.getElementById('native-code').value = '';
			document.getElementById('expanded-code').textContent = '';
			document.getElementById('code-dialog-caption').textContent = 'Ninguna capa seleccionada.';
			document.getElementById('selection-name').textContent = 'Ninguna capa seleccionada';
			document.getElementById('selection-kind').textContent = 'Prueba otra búsqueda o limpia los filtros.';
			selectionStatus.textContent = '';
			return;
		}
		updateAddButton();
		updateResultSelection();
		document.getElementById('selection-name').textContent = entry.name;
		document.getElementById('selection-kind').textContent = entry.service + ' · ' + (entry.type === 'base'
			? 'Fondo'
			: 'Superposición');
		updateSelectionStatus();

		renderCode();
	}
	function renderCode() {
		document.getElementById('copy-code').textContent = 'Copiar';
		const entry = byName.get(select.value);
		if (!entry) return;
		const opacity = active.get(entry.name)?.options.opacity;
		const override = opacity !== undefined && opacity !== (entry.config.options.opacity ?? 1)
			? ', { opacity: ' + opacity + ' }'
			: '';
		const plugin = 'L.tileLayer.providerESP(\'' + entry.name + '\'' + override + ').addTo(map);';
		const native = nativeCode(entry);
		document.getElementById('native-code').value = native;
		document.getElementById('dialog-code-format').value = codeFormat.value;
		const code = codeFormat.value === 'native'
			? native
			: plugin;
		document.getElementById('layer-code').value = code;
		document.getElementById('expanded-code').textContent = code;
		document.getElementById('code-dialog-caption').textContent = entry.name + ' · ' + (codeFormat.value === 'native'
			? 'Leaflet sin el plugin'
			: 'Con leaflet-providersESP');
	}
	function updateAddButton() {
		const entry = byName.get(select.value);
		const button = document.getElementById('show-layer');
		button.disabled = !entry || active.has(entry.name);
		button.textContent = !entry
			? 'Añadir al mapa'
			: active.has(entry.name)
				? 'En el mapa ✓'
				: entry.type === 'base'
					? 'Usar como fondo'
					: 'Añadir al mapa';
	}
	function updateSelectionStatus() {
		const entry = byName.get(select.value);
		if (!entry) {
			selectionStatus.textContent = ''; return;
		}
		if (!active.has(entry.name)) {
			selectionStatus.textContent = 'Seleccionada: ' + entry.name + '. Todavía no está en el mapa.'; return;
		}
		if (hiddenLayers.has(entry.name)) {
			selectionStatus.textContent = entry.name + ' está oculta. Puedes mostrarla desde En el mapa.'; return;
		}
		const options = entry.config.options;
		if (map.getZoom() < (options.minZoom ?? 0)) selectionStatus.textContent = entry.name + ': acércate al zoom ' + options.minZoom + ' para ver esta capa.';
		else if (map.getZoom() > (options.maxZoom ?? 18)) selectionStatus.textContent = entry.name + ': reduce el zoom para ver esta capa.';
		else selectionStatus.textContent = '';
	}
	function normalize(value) {
		return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
			.toLowerCase();
	}
	function updateResultSelection() {
		for (const button of document.querySelectorAll('.layer-result')) {
			button.setAttribute('aria-pressed', String(button.dataset.provider === select.value));
			button.querySelector('.result-in-map').textContent = active.has(button.dataset.provider)
				? 'En el mapa'
				: '';
		}
	}
	function renderResults(entries) {
		const results = document.getElementById('layer-results');
		results.replaceChildren();
		if (!viewer) return;
		if (!entries.length) {
			const empty = document.createElement('li'); empty.textContent = 'No hay capas con estos filtros.'; results.append(empty); return;
		}
		for (const entry of entries) {
			const button = document.createElement('button'); button.type = 'button'; button.className = 'layer-result'; button.dataset.provider = entry.name;
			button.setAttribute('aria-label', 'Seleccionar ' + entry.name);
			const title = document.createElement('strong'); title.textContent = entry.name;
			const detail = document.createElement('span'); detail.textContent = entry.service + ' · ' + (entry.type === 'base'
				? 'Fondo'
				: 'Superposición');
			const badge = document.createElement('small'); badge.className = 'result-in-map';
			button.append(title, detail, badge);
			button.addEventListener('click', () => {
				select.value = entry.name; describe();
				if (!document.getElementById('show-layer').disabled) document.getElementById('show-layer').focus();
			});
			const item = document.createElement('li'); item.append(button); results.append(item);
		}
		updateResultSelection();
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
		const query = normalize(search.value.trim());
		const entries = catalog.filter((entry) => {
			if (service.value && entry.service !== service.value) return false;
			if (type.value && entry.type !== type.value) return false;
			const terms = [entry.name, entry.config.url, entry.config.options.attribution];
			if (entry.name.startsWith('PNOA.')) terms.push('ortofoto ortofotografia imagen aerea');
			if (entry.name.startsWith('IGNBase.')) terms.push('mapa base callejero');
			if (entry.name.startsWith('UnidadesAdm.')) terms.push('limites administrativos');
			return normalize(terms.join(' ')).includes(query);
		});
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
		renderResults(entries);
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
		syncStack();
		renderActive();
		renderCode();
		reportTiles();
		if (viewer && mobile.matches) setPanelOpen(false);
		else if (viewer) document.getElementById('copy-code').focus();
	}
	async function copy(id, message) {
		const field = document.getElementById(id);
		try {
			await navigator.clipboard.writeText(field.value);
			status.textContent = message;
			document.getElementById('copy-code').textContent = 'Copiado ✓';
		} catch {
			if (document.getElementById('code-dialog').open) {
				const range = document.createRange(); range.selectNodeContents(document.getElementById('expanded-code'));
				window.getSelection().removeAllRanges(); window.getSelection().addRange(range);
				document.getElementById('code-dialog-caption').textContent = 'No se ha podido copiar automáticamente. El código está seleccionado: usa el menú de tu dispositivo o Ctrl+C.';
				return;
			}
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
	document.getElementById('copy-code').addEventListener('click', () => copy('layer-code', 'Código copiado.'));
	document.getElementById('copy-native').addEventListener('click', () => copy('layer-code', 'Código copiado.'));
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
		params.set('hidden', [...hiddenLayers].join(','));
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
	function activateTab(name, focus = false) {
		for (const key of ['explore', 'active']) {
			const tab = document.getElementById(key + '-tab');
			const selected = key === name;
			tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected
				? 0
				: -1;
			document.getElementById(key + '-panel').hidden = !selected;
			if (selected && focus) tab.focus();
		}
	}
	function setPanelOpen(open, restoreFocus = true) {
		app.classList.toggle('panel-open', open);
		document.getElementById('open-panel').setAttribute('aria-expanded', String(open));
		if (open) document.getElementById(document.getElementById('active-tab').getAttribute('aria-selected') === 'true'
			? 'active-tab'
			: 'layer-search').focus();
		else if (restoreFocus && mobile.matches) document.getElementById('open-panel').focus();
		map.invalidateSize();
	}
	for (const key of ['explore', 'active']) document.getElementById(key + '-tab').addEventListener('click', () => activateTab(key));
	document.querySelector('.panel-tabs').addEventListener('keydown', (event) => {
		if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
		event.preventDefault();
		activateTab(event.key === 'Home'
			? 'explore'
			: event.key === 'End'
				? 'active'
				: document.getElementById('active-tab').getAttribute('aria-selected') === 'true'
					? 'explore'
					: 'active', true);
	});
	document.getElementById('open-panel').addEventListener('click', () => setPanelOpen(!app.classList.contains('panel-open')));
	document.getElementById('close-panel').addEventListener('click', () => setPanelOpen(false));
	document.addEventListener('keydown', (event) => {
		if (event.key !== 'Escape' || document.getElementById('code-dialog').open) return;
		if (app.classList.contains('panel-open')) setPanelOpen(false);
		else if (expanded && !nativeExpanded) setExpanded(false);
	});
	document.querySelector('a[href="#layer-search"]').addEventListener('click', () => {
		if (viewer && mobile.matches) setPanelOpen(true);
	});
	codeFormat.addEventListener('change', renderCode);
	document.getElementById('dialog-code-format').addEventListener('change', (event) => {
		codeFormat.value = event.target.value; renderCode();
	});
	function openCode() {
		renderCode(); document.getElementById('code-dialog').showModal();
	}
	document.getElementById('expand-code').addEventListener('click', openCode);
	document.getElementById('mobile-code').addEventListener('click', openCode);
	document.getElementById('close-code').addEventListener('click', () => document.getElementById('code-dialog').close());
	document.getElementById('mobile-copy').addEventListener('click', () => copy('layer-code', 'Código copiado.'));
	document.getElementById('clear-filters').addEventListener('click', () => {
		search.value = ''; service.value = ''; type.value = ''; filter(); search.focus();
	});
	map.on('moveend zoomend', updateSelectionStatus);
	mobile.addEventListener('change', () => {
		setPanelOpen(false, false); map.invalidateSize();
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
	for (const name of (saved.get('hidden') || '').split(',')) {
		if (active.has(name)) {
			hiddenLayers.add(name); map.removeLayer(active.get(name)); loading.delete(name); failed.delete(name);
		}
	}
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
