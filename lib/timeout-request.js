'use strict';
const extend = require('gextend');
const defaults = {
    timeout: 30000,
    timeoutRequestPrefix: 'session:tr',
    parseToken: function(token) {
        let cancelTokenId = this.chyper.decrypt(token);
        let chunks = cancelTokenId.split(':');
        this.sessionId = chunks[2];
    }
};

/**
 * A TimeoutRequest provides a grace
 * period of time before we evict a
 * session object.
 *
 * Any incumbent client has a chance to
 * prevent the eviction, and either let
 * the session run it's established TTL
 * or update the TTL.
 *
 * TimeoutRequest hold a sessoin object
 * identifier and use this key to retrieve
 * the instance from the session store.
 *
 */
class TimeoutRequest {
    constructor(options) {
        options = extend({}, defaults, options);

        this.init(options);
    }

    init(options = {}) {
        let token;
        if (options.token) {
        }
        extend(this, options);

        if (options.token) {
            this.parseToken(options.token);
        }
    }

    start() {
        this.canceled = false;
        this.evictOnCancel = false;

        const key = this.store.sessionExpiredEventType(this.cancelTokenId);

        this.store.once(key, item => {
            this.handler();
        });

        return this.store.add(this.cancelTokenId, this, this.timeout);
    }

    handler() {
        if (this.canceled) return;
        this.store.del(this.sessionId);
    }

    cancel(evictOnCancel = false) {
        this.canceled = true;
        this.evictOnCancel = evictOnCancel;

        const key = this.store.sessionExpiredEventType(this.cancelTokenId);

        return new Promise((resolve, reject) => {
            this.store.removeAllListeners(key);
            this.store.del(this.cancelTokenId);

            if (evictOnCancel) {
                this.handler();
            }

            resolve();
        });
    }

    serialize() {
        return JSON.stringify(this.toJSON());
    }

    deserialize(data) {
        if (!data) return this;

        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch (error) {
                console.error(error);
                data = {};
            }
        }

        this.fromJSON(data);

        return this;
    }

    fromJSON(obj) {
        this.init(obj);
        return this;
    }

    toJSON() {
        return {
            sessionId: this.sessionId,
            timeout: this.timeout,
            token: this.token,
            timeoutRequestPrefix: this.timeoutRequestPrefix,
            __type__: 'TimeoutRequest'
        };
    }

    get cancelTokenId() {
        return `${this.timeoutRequestPrefix}:${this.sessionId}:${this.timeout}`;
    }

    get token() {
        return this.chyper.encrypt(this.cancelTokenId);
    }

    set token(v){
        this.parseToken(v);
    }
}

module.exports = TimeoutRequest;
