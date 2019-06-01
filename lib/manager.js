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
        seed: getGuid(35)
    },
    makeExpireStore: function(options) {
        return new MemoryExpire(options);
    },
    dispatcher: undefined
};

class SessionManger extends EventEmitter {
    constructor(config) {
        super();
        config = extend({}, defaults, config);

        this.init(config);
    }

    init(config = {}) {
        extend(this, config);

        if (!this.dispatcher) {
            this.dispatcher = this;
        }

        /*
         * Build the actual expire store.
         * By default we use a memory expire
         * store. We could use a redis store
         * or some other userland implementation.
         */
        this.store = this.makeExpireStore(config.store);

        this.chyper = new Chyper(config.chyper);

        /**
         * Forward expiration events from manager.
         */
        this.store.on('session.expired', event => {
            this.dispatcher.emit('session.expired', event);
            this.dispatcher.emit(`session.expired.${event.key}`, event);
        });
    }

    /**
     * Creates a new session object, which will
     * be saved in the session store.
     * Each session object has an associated TTL.
     * 
     * TODO: We want to create a session id and use
     * the identifier to index the session. So we
     * can find it by either the session id or the
     * given identifier.
     *
     * @param {String} identifier Session object id
     * @param {Object} data Data associated with the session
     * @param {Integer} [ttl=30000] TTL of session object in milli
     * @return {Promise} Resolves to SessionObject
     */
    createSessionObject(identifier, data = {}, ttl = 30000) {

        //TODO: What we really want is to have the session
        // use it's id and then use identifier as an lookup
        // key. We create a session and use it's ID as token, 
        //and then but we want to find an entity that is related
        //to that session. We use the identifier.

        /**
         * Normalize arguments. We can ommit
         * the identifier and just send data
         */
        if (typeof identifier === 'object') {
            if (typeof data === 'number') {
                ttl = data;
            }
            data = identifier;
            identifier = getGuid(32);
        }

        const options = {
            ttl,
            data,
            identifier,
            store: this.store
        };

        const session = new SessionObject(options);

        return session.register();
    }

    /**
     * 
     * @param {Stign} identifier Session object id
     * @param {Boolean} [notify=false] Emit notice event on expire?
     * @return {Promise} Resolves to SessionObject
     */
    terminateSession(identifier, notify = false) {
        const session = new SessionObject({
            identifier,
            store: this.store
        });

        return session.terminate(notify);
    }

    /**
     * Find a Session object by it's token
     * id.
     *
     * @param {String} sessionId Session token id
     * @return {Promise} Resolves to SessionObject
     */
    findSessionById(sessionId) {
        return this.store.get(sessionId).then(item => {
            return SessionObject.fromSerializedItem(item, this.store);
        });
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
     * @return {Promise} Resolves to TimeoutRequest
     */
    startTimeoutPeriod(sessionId, timeout = 3000) {
        const request = new TimeoutRequest({
            timeout,
            sessionId,
            store: this.store,
            chyper: this.chyper
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
     * @return {Promise} Resolves to TimeoutRequest
     */
    cancelTimeoutPeriod(cancelTokenId, evictOnCancel = false) {
        const request = new TimeoutRequest({
            chyper: this.chyper,
            store: this.store
        });

        request.parseToken(cancelTokenId);

        return request.cancel(evictOnCancel);
    }
}

module.exports = SessionManger;
