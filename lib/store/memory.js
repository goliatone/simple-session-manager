'use strict';

const extend = require('gextend');
const EventEmitter = require('events');

const defaults = {
    ttl: 30000
};

class MemoryStore extends EventEmitter {

    constructor(options = {}) {
        super();
        
        options = extend({}, defaults, options);

        this.init(options);
    }

    init(options) {
        this._ttl = {};
        this._items = {};

        extend(this, options);
    }

    touch(key, ttl=this.ttl) {
        const item = this._items[key];
            
        if(!item) {
            return Promise.resolve(false);
        }

        return this.add(key, item, ttl);
    }

    has(key) {
        return new Promise((resolve, reject) => {
            resolve(!!this._items[key]);
        });
    }

    add(key, item, ttl = this.ttl) {
        return new Promise((resolve, reject) => {

            this._items[key] = item;

            clearTimeout(this._ttl[key]);

            this._ttl[key] = setTimeout(_ => {
                this.del(key);
            }, ttl);

            resolve(item);
        });
    }

    get(key) {
        return new Promise((resolve, reject) => {
            resolve(this._items[key]);
        });
    }

    del(key) {
        return new Promise((resolve, reject) => {
            const item = this._items[key];

            this.notifyExpired(key, item);

            delete this._items[key];
            clearTimeout(this._ttl[key]);

            resolve({ key, item });
        });
    }

    onexpire(key, handler) {
        return this.once(this.sessionExpiredEventType(key), handler);
    }

    sessionExpiredEventType(key) {
        return `session.expired.${key}`;
    }
}

module.exports = MemoryStore;