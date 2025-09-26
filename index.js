const Hoek = require('hoek');

const defaultConfig = {
    host: 'localhost',
    port: 3000,
    database: {
        name: 'myapp',
        host: 'localhost',
        port: 5432
    },
    features: {
        logging: true,
        cache: false
    }
};

const userConfig = {
    port: 8080,
    database: {
        name: 'production_db'
    },
    features: {
        cache: true,
        monitoring: true
    }
};

console.log('=== Hoek Utility Examples ===\n');

console.log('1. Merge configurations:');
const mergedConfig = Hoek.merge(defaultConfig, userConfig);
console.log('Merged config:', JSON.stringify(mergedConfig, null, 2));

console.log('\n2. Deep clone an object:');
const clonedConfig = Hoek.clone(mergedConfig);
clonedConfig.port = 9000;
console.log('Original port:', mergedConfig.port);
console.log('Cloned (modified) port:', clonedConfig.port);

console.log('\n3. Reach into nested objects:');
const dbName = Hoek.reach(mergedConfig, 'database.name');
console.log('Database name:', dbName);

console.log('\n4. Assert conditions:');
try {
    Hoek.assert(mergedConfig.port > 0, 'Port must be positive');
    console.log('Port assertion passed');
} catch (err) {
    console.log('Port assertion failed:', err.message);
}

console.log('\n5. Apply to defaults:');
const options = Hoek.applyToDefaults(
    { a: 1, b: 2, c: { d: 3 } },
    { b: 5, c: { e: 6 } }
);
console.log('Applied options:', JSON.stringify(options, null, 2));

console.log('\n6. Flatten an array:');
const nestedArray = [1, [2, 3], [4, [5, 6]]];
const flattened = Hoek.flatten(nestedArray);
console.log('Flattened array:', flattened);

console.log('\n7. Check if value contains another:');
const array = [1, 2, 3, 4, 5];
console.log('Array contains 3:', Hoek.contain(array, 3));
console.log('Array contains 10:', Hoek.contain(array, 10));

console.log('\n8. Deep equal comparison:');
const obj1 = { a: 1, b: { c: 2 } };
const obj2 = { a: 1, b: { c: 2 } };
const obj3 = { a: 1, b: { c: 3 } };
console.log('obj1 deep equals obj2:', Hoek.deepEqual(obj1, obj2));
console.log('obj1 deep equals obj3:', Hoek.deepEqual(obj1, obj3));

console.log('\n9. Escaping HTML:');
const htmlString = '<script>alert("XSS")</script>';
const escaped = Hoek.escapeHtml(htmlString);
console.log('Original:', htmlString);
console.log('Escaped:', escaped);

console.log('\n10. Stringify objects:');
const circular = { a: 1 };
circular.b = circular;
console.log('Stringified circular reference:', Hoek.stringify(circular));

console.log('\n11. Once function (executes only once):');
const onceFunc = Hoek.once(() => {
    console.log('This will only print once!');
    return 'result';
});
console.log('First call:', onceFunc());
console.log('Second call:', onceFunc());
console.log('Third call:', onceFunc());