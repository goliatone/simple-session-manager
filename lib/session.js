'use strict';
const extend = require('gextend');
const SerializableObject = require('./serializable');

class SessionObject extends SerializableObject {
    init(config = {}) {
        super.init(config);

        if (this.identifier) {
            this.id = this.identifier;
        }
    }

    register() {
        return this.store.add(this.id, this, this.ttl);
    }

    onexpire(handler) {
        const key = this.store.sessionExpiredEventType(this.id);
        return this.store.once(key, handler);
    }
}

SessionObject.defaults = {
    _serializeProperties: ['id', 'identifier', 'ttl', 'data', 'createdAt']
};

module.exports = SessionObject;
