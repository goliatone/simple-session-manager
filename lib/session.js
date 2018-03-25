'use strict';
const extend = require('gextend');
const getGuid = require('./getGuid');

class SessionObject {
    
    constructor(config={}) {
        extend(this, config);
        
        if(this.identifier) {
            this.id = this.identifier;
        } else {
            this.id = getGuid();
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

module.exports = SessionObject;