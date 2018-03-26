'use strict';
const SessionManager = require('./manager');

module.exports = function(context, config) {
    
    const _logger = context.getLogger(config.moduleid);

    context.resolve(config.dependencies, true).then(_ => {
        _logger.info('Starting module %s...', config.moduleid);

        const sessionManager = new SessionManager(config);

        context.provide(config.moduleid, sessionManager);
    });
};