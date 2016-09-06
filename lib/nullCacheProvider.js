module.exports.create = function () {

    return {
        get: get,
        set: set,
        del: del,
        clearAll: clearAll,
        isNullCache: true
    };

    function get(id, cb) {
        cb();
    }

    function set(id, value, cb) {
        cb()
    }

    function del(id, cb) {
        cb();
    }

    function clearAll(cb) {
        cb();
    }
};