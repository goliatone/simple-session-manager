'use strict';
/**
 * Export module simple-session-manager.
 *
 * @type {Function}
 */
module.exports.SessionManager = require('./lib/manager');

module.exports.SessionObject = require('./lib/session');

module.exports.TimeoutRequest = require('./lib/timeout-request');

module.exports.store = {
    RedisStore: require('./lib/store/redis'),
    MemoryStore: require('./lib/store/memory')
};

module.exports.init = require('./lib/init');
