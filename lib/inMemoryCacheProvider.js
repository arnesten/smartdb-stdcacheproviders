let lru = require('lru-cache');
let nullCacheProvider = require('./nullCacheProvider.js');

module.exports = {
    create
};

function create(entityType, entitySettings) {

    let maxSize = entitySettings.cacheMaxSize;
    let maxAge = entitySettings.cacheMaxAge;
    if (!maxSize && !maxAge) return nullCacheProvider.create();

    let lruCache = lru({
        max: maxSize || 10000,
        maxAge: maxAge
    });

    return {
        get,
        set,
        // Avaiable for performance reason if used from another cache provider
        setStringified,
        del,
        clearAll
    };

    function get(id) {
        let value = lruCache.get(id);
        let doc;
        if (value) {
            doc = JSON.parse(value);
        }
        return Promise.resolve(doc);
    }

    function set(id, doc) {
        let value = JSON.stringify(doc);
        lruCache.set(id, value);
        return Promise.resolve();
    }

    function setStringified(id, value) {
        lruCache.set(id, value);
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
}