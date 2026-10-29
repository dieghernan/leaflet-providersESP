// Reload the initial page rather than manually rebuilding Leaflet controls.
(() => {
	'use strict';
	for (const button of document.querySelectorAll('[data-reset-map]')) {
		button.addEventListener('click', () => {
			// Prevent browsers from restoring edited form values during reload.
			for (const input of document.querySelectorAll('input')) {
				input.value = input.defaultValue; input.checked = input.defaultChecked;
			}
			for (const select of document.querySelectorAll('select')) {
				const index = [...select.options].findIndex((option) => option.defaultSelected);
				select.selectedIndex = Math.max(0, index);
			}
			for (const panel of document.querySelectorAll('#preview-info, #preview-list, .preview-code-block pre, .ribbon-panel, .leaflet-control-layers-list')) {
				panel.scrollTop = 0; panel.scrollLeft = 0;
			}
			window.scrollTo(0, 0);
			const url = new URL(window.location.href); url.hash = '';
			window.history.replaceState(null, '', url);
			window.location.reload();
		});
	}
})();
