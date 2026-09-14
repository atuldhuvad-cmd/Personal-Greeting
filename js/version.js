// Single source of truth for the app's release version. Loaded by index.html
// (sets window.WISHCRAFT_VERSION for the About panel) and importScripts()'d
// by sw.js (sets self.WISHCRAFT_VERSION inside the worker scope, used to
// derive the cache name) so the visible version and the service-worker
// cache version can never drift out of sync.
self.WISHCRAFT_VERSION = '22.2';
self.WISHCRAFT_CACHE = 'wishcraft-v' + self.WISHCRAFT_VERSION;
