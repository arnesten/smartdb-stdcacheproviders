'use strict';
let lru = require('lru-cache');
let nullCacheProvider = require('./nullCacheProvider.js');

module.exports.create = create;

function create(entityType, entitySettings) {

    let maxSize = entitySettings.cacheMaxSize;
    let maxAge = entitySettings.cacheMaxAge;
    if (!maxSize && !maxAge) return nullCacheProvider.create();

    let lruCache = lru({
        max: maxSize || 10000,
        maxAge: maxAge
    });

    return {
        get: get,
        set: set,
        // Avaiable for performance reason if used from another cache provider
        setStringified: setStringified,
        del: del,
        clearAll: clearAll
    };

    function get(id, cb) {
        let value = lruCache.get(id);
        let doc;
        if (value) {
            doc = JSON.parse(value);
        }
        cb(null, doc);
    }

    function set(id, doc, cb) {
        let value = JSON.stringify(doc);
        lruCache.set(id, value);
        cb();
    }

    function setStringified(id, value, cb) {
        lruCache.set(id, value);
        cb();
    }

    function del(id, cb) {
        lruCache.del(id);
        cb();
    }

    function clearAll(cb) {
        lruCache.reset();
        cb();
    }
}