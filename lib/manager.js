'use strict';
const extend = require('gextend');
const EventEmitter = require('events');
const SessionObject = require('./session');
const MemoryExpire = require('./store/memory');
const TimeoutRequest = require('./timeout-request');
const Chyper = require('./crypto');
const getGuid = require('./getGuid');

const defaults = {
    chyper: {
        iv: getGuid(16),
        seed: getGuid(35), 
    },
    makeExpireStore: function(options) {
        return new MemoryExpire(options);
    }  
};

class SessionManger extends EventEmitter {

    constructor(config) {
        super();
        config = extend({}, defaults, config);

        this.init(config);
    }

    init(config={}) {
        extend(this, config);

        /*
         * Build the actual expire store.
         * By default we use a memory expire
         * store. We could use a redis store
         * or some other userland implementation.
         */
        this.store = this.makeExpireStore(config.store);

        this.chyper = new Chyper(config.chyper);
    }

    /**
     * Creates a new session object, which will
     * be saved in the session store.
     * Each session object has an associated TTL.
     * 
     * @param {String} identifier Session object id
     * @param {Object} data Data associated with the session
     * @param {Integer} [ttl=30000] TTL of session object in milli
     * @return {Promise}
     */
    createSessionObject(identifier, data={}, ttl=30000) {
        
        const options = {
            ttl,
            data,
            identifier,
            store: this.store,
        };

        const session = new SessionObject(options);

        return session.register();
    }

    /**
     * Find a Session object by it's token
     * id.
     * 
     * @param {String} sessionId Session token id
     * @return {Promise}
     */
    findSessionById(sessionId) { 
        return this.store.get(sessionId);
    }

    /**
     * We can request to cancel a session,
     * however we give the chance to any 
     * entities using the session object to
     * request an extension. 
     * 
     * If the timeout period expires without 
     * a request for an extension the session
     * object will be effectively evicted from 
     * the store.
     * 
     * A timeout request will generate a token.
     * We need to use this token to cancel the 
     * request.
     * 
     * @param {String} sessionId Session token id
     * @param {Integer} timeout time in milliseconds
     * @return {Promise}
     */
    startTimeoutPeriod(sessionId, timeout=3000) {

        const request = new TimeoutRequest({
            timeout,
            sessionId, 
            store: this.store,
            chyper: this.chyper,
        });

        return request.start();
    }

    /**
     * A request for timeout period has been 
     * answered by canceling the timeout.
     * 
     * Any of the incumbent clients have decided
     * to claim the session as active.
     * 
     * @param {String} sessionId Session token id
     * @param {Boolean} [evictOnCancel=false] Wether to
     *                  execute the timeout handler on cancel    
     */
    cancelTimeoutPeriod(cancelTokenId, evictOnCancel=false) {
        const request = new TimeoutRequest({
            chyper: this.chyper,
            store: this.store,
        });
        
        request.parseToken(cancelTokenId);

        return request.cancel(evictOnCancel);
    }
}

module.exports = SessionManger;