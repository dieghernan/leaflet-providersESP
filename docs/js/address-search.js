// CartoCiudad candidates/find flow shared with the codigospostales viewer.
window.addAddressSearch = (map, onOpen) => {
	'use strict';
	const control = L.control({ position: 'topleft' });
	control.onAdd = () => {
		const container = L.DomUtil.create('div', 'leaflet-bar address-control');
		container.innerHTML = '<button id="address-toggle" class="locate-button" type="button" title="Buscar dirección" aria-label="Buscar dirección" aria-expanded="false" aria-controls="address-panel"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/></svg></button><section id="address-panel" class="address-panel" aria-label="Buscar dirección con CartoCiudad" hidden><form id="address-form" role="search" aria-label="Buscar dirección"><label for="address-query" class="sr-only">Dirección en España</label><input id="address-query" type="search" placeholder="Calle, número y municipio" minlength="3" maxlength="200" required><button type="submit">Buscar</button><button id="address-close" type="button" aria-label="Cerrar búsqueda">×</button></form><p id="address-status" role="status" aria-live="polite"></p><ul id="address-results" aria-label="Direcciones encontradas" hidden></ul><p class="address-source">Geocodificación: <a href="https://www.cartociudad.es/">CartoCiudad (IGN/CNIG)</a></p></section>';
		L.DomEvent.disableClickPropagation(container); L.DomEvent.disableScrollPropagation(container);
		L.DomEvent.on(container, 'keydown', L.DomEvent.stopPropagation);
		const toggle = container.querySelector('#address-toggle');
		const panel = container.querySelector('#address-panel');
		const form = container.querySelector('#address-form');
		const query = container.querySelector('#address-query');
		const status = container.querySelector('#address-status');
		const results = container.querySelector('#address-results');
		let request;
		let marker;
		function positionPanel() {
			if (panel.hidden) return;
			const bounds = container.getBoundingClientRect();
			const mapBounds = map.getContainer().getBoundingClientRect();
			const below = mapBounds.bottom - bounds.top - 8;
			const above = bounds.bottom - mapBounds.top - 8;
			const upwards = below < 180 && above > below;
			panel.style.top = upwards
				? 'auto'
				: '-2px'; panel.style.bottom = upwards
				? '-2px'
				: 'auto';
			panel.style.maxHeight = Math.max(80, upwards
				? above
				: below) + 'px';
		}
		map.on('resize', positionPanel);
		function cancel() {
			request?.abort(); request = undefined; form.removeAttribute('aria-busy');
		}
		function setOpen(open, restoreFocus = false) {
			panel.hidden = !open; toggle.setAttribute('aria-expanded', String(open));
			if (open) {
				onOpen(); positionPanel(); query.focus();
			} else {
				cancel(); status.textContent = ''; if (restoreFocus) toggle.focus();
			}
		}
		toggle.addEventListener('click', () => setOpen(panel.hidden));
		container.querySelector('#address-close').addEventListener('click', () => setOpen(false, true));
		container.addEventListener('keydown', (event) => {
			if (event.key === 'Escape' && !panel.hidden) {
				event.preventDefault(); setOpen(false, true);
			}
		});
		document.addEventListener('click', (event) => {
			if (!panel.hidden && !container.contains(event.target)) setOpen(false);
		}, true);
		query.addEventListener('input', () => {
			cancel(); results.replaceChildren(); results.hidden = true; status.textContent = '';
		});
		function hasCoordinates(value) {
			return value && Number.isFinite(value.lat) && Number.isFinite(value.lng) && Math.abs(value.lat) <= 90 && Math.abs(value.lng) <= 180 && !(value.lat === 0 && value.lng === 0);
		}
		async function getJSON(url, signal) {
			const response = await fetch(url, { signal });
			if (!response.ok) throw new Error('Servicio no disponible');
			return response.json();
		}
		async function run(message, task) {
			cancel();
			const current = new AbortController(); request = current;
			const timeout = window.setTimeout(() => current.abort(), 15000);
			form.setAttribute('aria-busy', 'true'); status.textContent = message;
			try {
				await task(current);
			} catch {
				if (request === current) status.textContent = 'No se ha podido completar la búsqueda. Vuelve a intentarlo.';
			} finally {
				window.clearTimeout(timeout);
				if (request === current) {
					request = undefined; form.removeAttribute('aria-busy');
				}
			}
		}
		function showAddress(candidate) {
			return run('Localizando dirección…', async(current) => {
				let location = candidate;
				if (!hasCoordinates(location)) {
					const url = new URL('https://www.cartociudad.es/geocoder/api/geocoder/find');
					url.searchParams.set('id', candidate.id); url.searchParams.set('type', candidate.type);
					location = await getJSON(url, current.signal);
				}
				if (request !== current || current.signal.aborted) return;
				if (!hasCoordinates(location)) throw new Error('Coordenadas no disponibles');
				const label = document.createElement('div'); label.textContent = candidate.address;
				if (marker) map.removeLayer(marker);
				marker = L.marker([location.lat, location.lng], { alt: 'Dirección localizada',
					title: 'Dirección localizada',
					attribution: 'Geocodificación: <a href="https://www.cartociudad.es/">CartoCiudad (IGN/CNIG)</a>' }).addTo(map)
					.bindPopup(label);
				map.setView([location.lat, location.lng], 16); marker.openPopup();
				const popupClose = marker.getPopup().getElement()
					.querySelector('.leaflet-popup-close-button');
				if (popupClose) {
					popupClose.title = 'Cerrar dirección'; popupClose.setAttribute('aria-label', 'Cerrar dirección');
				}
				results.hidden = true; status.textContent = 'Dirección localizada.';
			});
		}
		form.addEventListener('submit', (event) => {
			event.preventDefault();
			const value = query.value.trim();
			if (value.length < 3) {
				status.textContent = 'Introduce al menos tres caracteres.'; return;
			}
			results.replaceChildren(); results.hidden = true;
			run('Buscando direcciones…', async(current) => {
				const url = new URL('https://www.cartociudad.es/geocoder/api/geocoder/candidates');
				url.searchParams.set('q', value); url.searchParams.set('limit', '5');
				const data = await getJSON(url, current.signal);
				if (request !== current || current.signal.aborted) return;
				if (!Array.isArray(data)) throw new Error('Respuesta no válida');
				const candidates = data.filter((item) => item && typeof item.address === 'string' && (hasCoordinates(item) || item.id != null && typeof item.type === 'string' && item.type)).slice(0, 5);
				if (!candidates.length) {
					status.textContent = 'No se han encontrado direcciones. Prueba con calle, número y municipio.'; return;
				}
				for (const candidate of candidates) {
					const item = document.createElement('li'); const button = document.createElement('button'); button.type = 'button'; button.textContent = candidate.address;
					button.addEventListener('click', () => showAddress(candidate)); item.append(button); results.append(item);
				}
				results.hidden = false; status.textContent = candidates.length + ' resultados. Elige una dirección para situarla en el mapa.';
			});
		});
		return container;
	};
	control.addTo(map);
};
