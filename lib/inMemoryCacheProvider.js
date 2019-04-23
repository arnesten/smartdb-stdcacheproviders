let LRU = require('lru-cache');
let clone = require('clone');
let nullCacheProvider = require('./nullCacheProvider.js');

module.exports = {
    create
};

function create(entityType, entitySettings) {

    let maxSize = entitySettings.cacheMaxSize;
    let maxAge = entitySettings.cacheMaxAge;
    if (!maxSize && !maxAge) return nullCacheProvider.create();

    let lruCache = new LRU({
        max: maxSize || 1000,
        maxAge: maxAge
    });

    return {
        get,
        set,
        del,
        clearAll
    };

    function get(id) {
        let doc = lruCache.get(id);
        if (doc) {
            let clonedDoc = cloneFast(doc);
            return Promise.resolve(clonedDoc);
        }
        return Promise.resolve();
    }

    function set(id, doc) {
        let clonedDoc = cloneFast(doc);
        lruCache.set(id, clonedDoc);
        return Promise.resolve();
    }

    function del(id) {
        lruCache.del(id);
        return Promise.resolve();
    }

    function clearAll() {
        lruCache.reset();
        return Promise.resolve();
    }

    function cloneFast(obj) {
        return clone(obj, false);
    }
}