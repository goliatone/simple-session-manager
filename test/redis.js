'use strict';

const test = require('tape');
const Redis = require('../lib/store/redis');

let _backend;

function createRedisClient() {
    const id = 'localhost:6307';
    const client = require('fakeredis').createClient(6307, 'localhost');
    _backend = require('fakeredis').backends[id];
    return client;
}

test('"has" checks if key is stored', t => {
    const memory = new Redis({
        createRedisClient
    });

    _backend.SET('test', 'test');

    memory.has('test').then(expected => {
        t.ok(expected);
        t.end();
    });
});

test('"get" returns an item if key is stored', t => {
    const item = { foo: 'bar' };

    const memory = new Redis({
        createRedisClient
    });

    _backend.SET('item', JSON.stringify(item));

    memory.get('item').then(result => {
        t.isEquivalent(item, result);
        t.end();
    });
});

test('"add" will retain an object until ttl expires', async t => {
    const item = { foo: 'bar' };

    const memory = new Redis({
        createRedisClient
    });

    await memory.add('item', item, 10);

    setTimeout(async () => {
        const expected = await memory.has('item');
        t.false(false);
        t.end();
    }, 20);
});

test('"add" will call "onexpire" handler when an object expires', async t => {
    t.plan(1);

    const item = { foo: 'bar' };

    const memory = new Redis({
        createRedisClient
    });

    memory.onexpire('item', expired => {
        console.log('expired', expired);
        t.assert(expired);
    });

    await memory.add('item', item, 100);
});

test('"add" will emit event when an object expires', t => {
    const item = { foo: 'bar' };

    const memory = new Redis({
        createRedisClient
    });

    memory.once('session.expired.item', expired => {
        t.assert(expired);
        t.end();
    });

    memory.add('item', item, 10);
});

test('"add" will emit event when any object expires', t => {
    t.plan(2);

    const item = { foo: 'bar' };

    const memory = new Redis({
        createRedisClient
    });

    memory.on('session.expired', expired => {
        t.assert(expired);
    });

    memory.add('item', item, 10);
    memory.add('item2', item, 10);
});

test('"del" will remove an object by its key before the ttl expires', t => {
    t.plan(1);

    const item = { foo: 'bar' };

    const memory = new Redis({
        createRedisClient
    });

    memory.add('item', item);

    memory.del('item').then(result => {
        t.isEquivalent(item, result.item);
    });
});

test('"touch" extends the ttl of an active object', t => {
    const item = { foo: 'bar' };

    const memory = new Redis({
        createRedisClient
    });

    let start = Date.now();

    memory.add('item', item, 10);
    memory.touch('item', 200);

    memory.once('session.expired.item', expired => {
        let margin = Date.now() - start;
        t.assert(margin >= 200);
        t.end();
    });
});
