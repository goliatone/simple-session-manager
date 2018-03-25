'use strict';
const extend = require('gextend');

const defaults = {
    timeout: 30000,
    timeoutRequestPrefix: 'session:timeout-request'
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
 * There can only be one timeout request
 * per session. If you create multiple
 * requests, as soon as you cancel one
 * request, all other pending requests
 * will be canceled as well.
 */
class TimeoutRequest {
    constructor(options) {
        options = extend({}, defaults, options);
        this.init(options);
    }

    init(options = {}) {
        extend(this, options);
    }

    start() {
        const key = this.store.sessionExpiredEventType(this.cancelTokenId);
        
        this.store.once(key, (item) => {
            this.handler();
        });

        return this.store.add(this.cancelTokenId, this, this.timeout);
    }

    handler() {
        this.store.del(this.sessionId);
    }

    cancel(evictOnCancel = false) {
        this.canceled = true;
        this.evictOnCancel = evictOnCancel;
        
        const key = this.store.sessionExpiredEventType(this.cancelTokenId);

        return new Promise((resolve, reject) => {

            this.store.removeAllListeners(key);            
            this.store.del(this.cancelTokenId);
            
            if(evictOnCancel) {
                this.handler();
            }

            resolve();
        });
    }

    get cancelTokenId() {
        return `${this.timeoutRequestPrefix}:${this.sessionId}`;
    }
}

module.exports = TimeoutRequest;
