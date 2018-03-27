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
        return /^session:tr:(.+):\d+$/.test(key);
    }
};

class RedisStore extends Store {
    init(options) {
        super.init(options);

        this.client = this.createRedisClient(options.redis);
        this.pubsub = this.createRedisClient(options.redis);

        this.subscribeToKeyEvents();
    }

    subscribeToKeyEvents() {
        this.pubsub.subscribe(`__keyevent@0__:expired`);

        this.pubsub.on('message', (channel, message) => {
            if (!this.isValidKey(message)) return;

            const key = message;
            this.client.get(`${key}:data`, (err, res) => {
                const item = this.deserialize(res);
                this.notifyExpired(key, item);
            });
        });
    }

    isValidKey(key) {
        return this.keyValidator(key);
    }

    touch(key, ttl = this.ttl) {
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

    has(key) {
        return new Promise((resolve, reject)=>{
            this.client.exists(key, (err, exists) => {
                if (err) {
                    return reject(err);
                }
    
                return resolve(exists);
            });
        });
    }

    add(key, item, ttl = this.ttl) {
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

    get(key) {
        return new Promise((resolve, reject) => {
            this.client.get(key, (err, result) => {
                if (err) return reject(err);
                if (!result) return resolve(false);
                resolve(this.deserialize(result));
            });
        });
    }

    del(key, notify=true) {
        return new Promise((resolve, reject) => {
            this.client
                .multi()
                .get(key)
                .del(key)
                .exec((err, res) => {
                    let item = res[0];
                    
                    if (item) {
                        item = this.deserialize(item);
                    }

                    if(notify) {
                        this.notifyExpired(key, item);
                    }
                    
                    resolve({ key, item });
                });
        });
    }
}

RedisStore.defaults = defaults;

module.exports = RedisStore;
