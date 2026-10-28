/* Compatibility entrypoint. Application source: assets/js/main.js. */
(function () {
    if (document.querySelector('script[src*="assets/js/main.js"]')) return;
    var entrypoint = document.createElement('script');
    entrypoint.src = new URL('assets/js/main.js?v=20261028-v3', document.currentScript.src).href;
    document.head.appendChild(entrypoint);
})();