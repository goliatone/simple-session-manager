'use strict';
'use strict';

const extend = require('gextend');
const EventEmitter = require('events');
const SessionObject = require('../session');
const TimeoutRequest = require('../timeout-request');

class Store extends EventEmitter {
    constructor(options = {}) {
        super();

        options = extend({}, this.constructor.defaults, options);

        this.init(options);
    }

    init(options) {
        extend(this, options);
    }

    notifyExpired(key, item) {
        this.emit(`session.expired`, { key, item });
        this.emit(`session.expired.${key}`, { key, item });
    }

    serialize(item) {
        const out = item.serialize ? item.serialize() : JSON.stringify(item);
        return out;
    }

    deserialize(data) {
        if (!data) return data;
        switch (data.__type__) {
            case 'SessionObject':
                return new SessionObject().deserialize(data);
            case 'TimeoutRequest':
                return new TimeoutRequest().deserialize(data);
        }
        return data;
    }

    onexpire(key, handler) {
        return this.once(this.sessionExpiredEventType(key), handler);
    }

    sessionExpiredEventType(key) {
        return `session.expired.${key}`;
    }
}

Store.defaults = {};

module.exports = Store;
