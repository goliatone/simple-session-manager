'use strict';
const extend = require('gextend');
const getGuid = require('./getGuid');

class SessionObject {
    
    constructor(config={}) {
        this.init(config);
    }

    init(config={}) {
        extend(this, config);
        
        if(this.identifier) {
            this.id = this.identifier;
        } else {
            this.id = getGuid();
        }
    }

    serialize() {
        return JSON.stringify(this.toJSON());
    }

    deserialize(data) {
        console.log('DATA', data);
        try {
            data = JSON.parse(data);
        } catch(err) {
            console.log('::::::::: session error', data);
            console.error(err);
        }
        this.fromJSON(data);
        return this;
    }

    fromJSON(obj){
        this.init(obj);
        return this;
    }

    toJSON() {
        return {
            id: this.id,
            ttl: this.ttl,
            identifier: this.identifier,
            data: this.data,
            __type__: 'SessionObject'
        };
    }

    register() {
        return this.store.add(this.id, this, this.ttl);
    }

    onexpire(handler) {
        const key = this.store.sessionExpiredEventType(this.id);
        return this.store.once(key, handler);
    }

}

module.exports = SessionObject;