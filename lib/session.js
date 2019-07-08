'use strict';
const extend = require('gextend');
const SerializableObject = require('./serializable');
const getGuid = require('./getGuid');

class SessionObject extends SerializableObject {
    init(config = {}) {

        super.init(config);

        if (this.identifier) {
            this.id = this.identifier;
        }

        if (!this.id) {
            this.identifier = this.id = getGuid(32);
        }
    }

    register() {
        return this.store.add(this.id, this, this.ttl);
    }

    addIndex(index) {
        return this.sore.add(index, this, this.ttl);
    }

    update(data, updateTtl = false) {
        return console.warn('---- NOT IMPLEMENTED: session manager...');
        //TODO: IMplement!!
        this.data = extend({}, this.data, data);
        this.store.update(this.id, this, updateTtl);
    }

    terminate(notify = false) {
        return this.store.del(this.id, notify);
    }

    onexpire(handler) {
        const key = this.store.sessionExpiredEventType(this.id);
        return this.store.once(key, handler);
    }
}

SessionObject.fromSerializedItem = (item, store) => {
    return new SessionObject({
        store,
        id: item.id,
        ttl: item.ttl,
        data: item.data,
        createdAt: item.createdAt,
        identifier: item.identifier,
    });
};

SessionObject.defaults = {
    _serializeProperties: ['id', 'identifier', 'ttl', 'data', 'createdAt']
};

module.exports = SessionObject;
