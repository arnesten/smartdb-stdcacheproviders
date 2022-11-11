export default {
    create
};

function create() {

    return {
        get: dummyResolve,
        set: dummyResolve,
        del: dummyResolve,
        clearAll: dummyResolve,
        isNullCache: true
    };

    function dummyResolve() {
        return Promise.resolve();
    }
}