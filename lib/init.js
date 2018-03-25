'use strict';
const SessionManager = require('./manager');

module.exports.init = function(context, config) {
    const _logger = context.getLogger('session');

    context.resolve(config.dependencies).then(_ => {
        
        const sessionManager = new SessionManager(config);

        context.provide('sessions', sessionManager);
    });
};