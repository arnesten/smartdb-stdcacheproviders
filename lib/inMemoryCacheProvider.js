let clone = require('clone');
let nullCacheProvider = require('./nullCacheProvider.js');

module.exports = {
    create
};

function create(entityType, entitySettings) {

    let maxSize = entitySettings.cacheMaxSize;
    let maxAge = entitySettings.cacheMaxAge;
    if (!maxSize && !maxAge) return nullCacheProvider.create();

    maxAge = maxAge || 1e9;
    maxSize = maxSize || 1e9;

    let newCache = entitySettings._cache1 || new Map();
    let oldCache = entitySettings._cache2 || new Map();
    let cacheRotateTime = Date.now();

    return {
        get,
        set,
        del,
        clearAll
    };

    function get(id) {
        handleCacheRotation();

        let entry = newCache.get(id) || oldCache.get(id);
        if (entry) {
            let entryAge = Date.now() - entry.time;
            if (entryAge <= maxAge) {
                let clonedDoc = cloneFast(entry.doc);
                return Promise.resolve(clonedDoc);
            }
        }
        return Promise.resolve();
    }

    function set(id, doc) {
        handleCacheRotation();

        let entry = {
            time: Date.now(),
            doc: cloneFast(doc)
        };
        newCache.set(id, entry);
        removeOldestEntryIfNeeded();
        return Promise.resolve();
    }

    function del(id) {
        newCache.delete(id);
        oldCache.delete(id);
        return Promise.resolve();
    }

    function clearAll() {
        newCache.clear();
        oldCache.clear();
        cacheRotateTime = Date.now();
        return Promise.resolve();
    }

    function removeOldestEntryIfNeeded() {
        // Will at most need to remove 1, since this is called on every set()
        let totalSize = newCache.size + oldCache.size;
        if (maxSize >= totalSize) return;

        if (oldCache.size) {
            let firstKey = getFirstKeyFromMap(oldCache);
            oldCache.delete(firstKey);
            return;
        }

        if (newCache.size) {
            let firstKey = getFirstKeyFromMap(newCache);
            newCache.delete(firstKey);
        }
    }

    function handleCacheRotation() {
        let now = Date.now();
        let timeSinceRotation = now - cacheRotateTime;
        if (timeSinceRotation > maxAge) {
            oldCache.clear();
            let clearedCache = oldCache;
            oldCache = newCache;
            newCache = clearedCache;
            cacheRotateTime = now;
        }
    }

    function getFirstKeyFromMap(map) {
        return map.keys().next().value;
    }

    function cloneFast(obj) {
        return clone(obj, false);
    }
}