import { assert, fakeClock, testCase } from 'bocha/node.mjs';
import InMemoryCacheProvider from '../lib/InMemoryCacheProvider.js';

export default testCase('InMemoryCacheProvider', {
    'cacheMaxAge set': {
        'can get a value that was set': async function () {
            let cache = createCache({ cacheMaxAge: 1000 });
            await cache.set('F1', { name: 'Shark' });

            let doc = await cache.get('F1');

            assert.equals(doc, { name: 'Shark' });
        },
        'can get a value up until it expires': async function () {
            let clock = fakeClock();
            let cache = createCache({ cacheMaxAge: 1000 });
            await cache.set('F1', { name: 'Shark' });
            clock.tick(1000);
            let doc1 = await cache.get('F1');
            assert.equals(doc1, { name: 'Shark' });

            clock.tick(1);
            let doc2 = await cache.get('F1');
            assert.equals(doc2, null);
        },
        'when set value for F1 and then wait two get after cacheMaxAge should NO longer be in cache': async function () {
            let clock = fakeClock();
            let cacheMap1 = new Map();
            let cacheMap2 = new Map();
            let cache = createCache({
                cacheMaxAge: 1000,
                _cache1: cacheMap1,
                _cache2: cacheMap2
            });
            await cache.set('F1', { name: 'Shark' });

            clock.tick(1001);
            await cache.get('F2');
            clock.tick(1001);
            await cache.get('F2');

            assert.equals(cacheMap1.size, 0);
            assert.equals(cacheMap2.size, 0);
        },
        'can get from cache even if start at worst moment': async function () {
            let clock = fakeClock();
            let cacheMap1 = new Map();
            let cacheMap2 = new Map();
            let cache = createCache({
                cacheMaxAge: 1000,
                _cache1: cacheMap1,
                _cache2: cacheMap2
            });
            clock.tick(1000);
            await cache.set('F1', { name: 'Shark' });

            clock.tick(999);
            await cache.get('F2');
            let fish = await cache.get('F1');
            assert.equals(fish, { name: 'Shark' });

            clock.tick(2);
            fish = await cache.get('F1');
            assert.equals(fish, null);
        },
        'when trying to set old revision that is already cached should keep last revision': async function () {
            let cache = createCache({ cacheMaxSize: 100 });
            await cache.set('F1', { name: 'No shark', _rev: '1-ABC' });
            await cache.set('F1', { name: 'White shark', _rev: '2-ABC' });
            await cache.set('F1', { name: 'Reef shark', _rev: '1-ABC' });
            let fish = await cache.get('F1');
            assert.equals(fish, { name: 'White shark', _rev: '2-ABC' });
        }
    },
    'cacheMaxSize': {
        'when is 2 and set 3 entities should ONLY keep last two': async function () {
            let cache = createCache({ cacheMaxSize: 2 });
            await cache.set('F1', { name: 'F1A' });
            await cache.set('F2', { name: 'F2A' });
            await cache.set('F3', { name: 'F3A' });

            let [f1, f2, f3] = await Promise.all([
                cache.get('F1'),
                cache.get('F2'),
                cache.get('F3')
            ]);

            assert.equals(f1, null);
            assert.equals(f2, { name: 'F2A' });
            assert.equals(f3, { name: 'F3A' });
        }
    }
});

function createCache(entitySettings) {
    return InMemoryCacheProvider(null, entitySettings);
}