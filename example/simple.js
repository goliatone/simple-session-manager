'use strict';

const SessionManager = require('../index').SessionManager;
const RedisStore = require('../index').store.RedisStore;

const pepe = { name: 'pepe', age: 22 };

let manager = new SessionManager({
    store: {
        redis: {
            host: '192.168.99.100'
        },
    },
    makeExpireStore: function(options) {
        return new RedisStore(options);
    }
});

// manager.createSessionObject('peperone', pepe, 2000).then(_ => {
//     manager.findSessionById('peperone').then(session => {
//         session.onexpire(() => {
//             console.log('session %s expired', session.id);
//         });
//     });
// });

manager.createSessionObject('peperone', pepe, 5000).then(session => {

    // manager.findSessionById('peperone').then(session =>{
    //     console.log('session data', session.data);
    // }); 
    
    manager.startTimeoutPeriod('peperone', 2000).then(request => {
        console.log('-> request for timeout     ', new Date(), request.token);
        // request.cancel();
        manager.cancelTimeoutPeriod(request.token, true);
        // manager.cancelTimeoutPeriod('peperone', false);
    });

    // manager.startTimeoutPeriod('peperone', 1000).then(request => {
    //     console.log('-> request for timeout     ', new Date(), request.token);
    //     request.cancel();
    //     // manager.cancelTimeoutPeriod(request.token, false);
    //     // manager.cancelTimeoutPeriod(request.token, true);
    // });

    session.onexpire(() => {
        console.log('session %s expired', session.id, new Date());
    });
});

process.on('unhandledRejection', (reason, promise) => {
    console.log(reason);
});