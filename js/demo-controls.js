(() => {
	if (window.self !== window.top) {
		document.body.classList.add('demo-embedded');
		document.getElementById('demo-fullscreen').hidden = false;
	}
})();
