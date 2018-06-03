'use strict';

const extend = require('gextend');
const Store = require('./index');

const defaults = {
    ttl: 30000,
    redis: {
        db: 0,
        port: 6379,
        host: 'localhost'
    },
    createRedisClient: function $createRedisClient(config = {}) {
        const redis = require('redis');

        let client;

        let {
            db = 0,
                port = 6379,
                host = 'localhost',
                path,
                password,
                options
        } = config;

        if (path) {
            client = redis.createClient(path, options);
        } else {
            client = redis.createClient(port, host, options);
        }

        if (password) {
            client.auth(password);
        }

        if (db) {
            client.select(db);
        }

        return client;
    },
    keyValidator: function(key) {
        /**
         * Not sure where this comes from?! lol
         */
        // return /^session:tr:(.+):\d+$/.test(key);
        return /^session:(.+)$/.test(key);
    },
    getIdFromKey: function(key) {
        return key.replace(/^session:/, '');
    },
    makeKeyFromId: function(key) {
        return `session:${key}`;
    }
};

class RedisStore extends Store {
    init(options) {
        super.init(options);

        this.client = this.createRedisClient(options.redis);
        this.pubsub = this.createRedisClient(options.redis);

        this.subscribeToKeyEvents();
    }

    /**
     * We listen for all "expired" events,
     * then filter out those that do not match 
     * the key naming convention.
     * 
     * Once we have a valid key, we retrieve the 
     * associated data and then delete the entry.
     * 
     * We notify of the expire event.
     */
    subscribeToKeyEvents() {
        this.pubsub.subscribe(`__keyevent@0__:expired`);

        this.pubsub.on('message', (channel, message) => {
            if (!this.isValidKey(message)) return;

            const key = message;

            this.client
                .multi()
                .get(`${key}:data`)
                .del(`${key}:data`)
                .exec((err, res) => {
                    const item = this.deserialize(res[0]);
                    this.notifyExpired(key, item);
                });
        });
    }

    isValidKey(key) {
        return this.keyValidator(key);
    }

    touch(id, ttl = this.ttl) {

        const key = this.makeKeyFromId(id);

        return new Promise((resolve, reject) => {
            this.client
                .multi()
                .get(key)
                .pexpire(key, ttl)
                .exec((err, res) => {
                    if (err) reject(err);
                    else resolve(this.deserialize(res[1]));
                });
        });
    }

    has(id) {

        const key = this.makeKeyFromId(id);

        return new Promise((resolve, reject) => {
            this.client.exists(key, (err, exists) => {
                if (err) {
                    return reject(err);
                }

                return resolve(exists);
            });
        });
    }

    add(id, item, ttl = this.ttl) {
        const key = this.makeKeyFromId(id);
        return new Promise((resolve, reject) => {
            const value = this.serialize(item);
            this.client
                .multi()
                .set(key, value, 'PX', ttl)
                .set(`${key}:data`, value)
                .exec((err, res) => {
                    if (err) reject(err);
                    else resolve(item);
                });
        });
    }

    get(id) {
        const key = this.makeKeyFromId(id);
        return new Promise((resolve, reject) => {
            this.client.get(key, (err, result) => {
                if (err) return reject(err);
                if (!result) return resolve(false);
                resolve(this.deserialize(result));
            });
        });
    }

    update(id, item, ttl) {
        //update the data:
        //if we dont want to invalidate the TTL we need to 
        //get current ttl value and add it again
        //if we want to update then we give a new TTL
        //if 
    }

    del(id, notify = true) {
        const key = this.makeKeyFromId(id);
        return new Promise((resolve, reject) => {
            this.client
                .multi()
                .get(key)
                .del(key)
                .del(`${key}:data`)
                .exec((err, res) => {
                    let item = res[0];

                    if (item) {
                        item = this.deserialize(item);
                    }

                    if (notify) {
                        this.notifyExpired(key, item);
                    }

                    resolve({ key, item });
                });
        });
    }
}

RedisStore.defaults = defaults;

module.exports = RedisStore;
