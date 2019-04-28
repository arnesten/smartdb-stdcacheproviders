let clone = require('clone');
let nullCacheProvider = require('./nullCacheProvider.js');

module.exports = {
    create
};

function create(entityType, entitySettings) {

    let maxSize = entitySettings.cacheMaxSize;
    let maxAge = entitySettings.cacheMaxAge;
    if (!maxSize && !maxAge) return nullCacheProvider.create();

    maxAge = maxAge || 1000000;
    maxSize = maxSize || 1000000;

    let cache1 = new Map();
    let cache1ClearTime = Date.now();
    let cache2 = new Map();
    let cache2ClearTime = Date.now();

    return {
        get,
        set,
        del,
        clearAll
    };

    function get(id) {
        let newestCache = getNewestCache();
        let oldestCache = getOldestCache();
        ensureCacheIsClearedRegularly();

        let entry = newestCache.get(id) || oldestCache.get(id);
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
        let entry = {
            time: Date.now(),
            doc: cloneFast(doc)
        };
        let newestCache = getNewestCache();
        newestCache.set(id, entry);
        removeOldestEntryIfNeeded();
        return Promise.resolve();
    }

    function del(id) {
        cache1.delete(id);
        cache2.delete(id);
        return Promise.resolve();
    }

    function clearAll() {
        cache1.clear();
        cache1ClearTime = Date.now();
        cache2.clear();
        cache2ClearTime = Date.now();
        return Promise.resolve();
    }

    function removeOldestEntryIfNeeded() {
        // Will at most need to remove 1, since this is called on every set()
        let totalSize = cache1.size + cache2.size;
        if (maxSize >= totalSize) return;

        let oldCache = getOldestCache();
        if (oldCache.size) {
            let firstKey = getFirstKeyFromMap(oldCache);
            oldCache.delete(firstKey);
            return;
        }

        let newestCache = getNewestCache();
        if (newestCache.size) {
            let firstKey = getFirstKeyFromMap(newestCache);
            newestCache.delete(firstKey);
        }
    }

    function ensureCacheIsClearedRegularly() {
        let now = Date.now();
        let shouldTargetCache1 = Math.floor(now / maxAge) % 2 === 0;
        if (shouldTargetCache1) {
            let cache1Age = now - cache1ClearTime;
            if (cache1Age > maxAge * 2) {
                cache1.clear();
                cache1ClearTime = now;
            }
        }
        else {
            let cache2Age = now - cache2ClearTime;
            if (cache2Age > maxAge * 2) {
                cache2.clear();
                cache2ClearTime = now;
            }
        }
    }

    function getOldestCache() {
        let isCache1Newest = cache1ClearTime > cache2ClearTime;
        if (isCache1Newest) {
            return cache2;
        }
        return cache1;
    }

    function getNewestCache() {
        let isCache1Newest = cache1ClearTime > cache2ClearTime;
        if (isCache1Newest) {
            return cache1;
        }
        return cache2;
    }

    function getFirstKeyFromMap(map) {
        return map.keys().next().value;
    }

    function cloneFast(obj) {
        return clone(obj, false);
    }
}