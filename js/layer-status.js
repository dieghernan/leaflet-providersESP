// Observe Leaflet tile requests without changing their loading behavior.
window.watchLayerStatus = (layer, update) => {
	'use strict';
	const state = { loading: false,
		error: false };
	layer.on('loading', () => {
		state.loading = true; state.error = false; update();
	});
	layer.on('tileerror', () => {
		if (!state.error) {
			state.error = true; update();
		}
	});
	layer.on('load', () => {
		state.loading = false; update();
	});
	layer.on('remove', () => {
		state.loading = false; state.error = false; update();
	});
	return state;
};
