import path from 'path';
import { setDefaultTimeout, watch } from 'bocha/node.mjs';

let __dirname = new URL('.', import.meta.url).pathname;

setDefaultTimeout(3000);

watch({
    srcPath: path.join(__dirname, '..'),
    testPath: __dirname,
    fileSuffix: '.tests.js'
});