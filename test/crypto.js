'use strict';

const test = require('tape');
const sinon = require('sinon');

const Chyper = require('../lib/crypto');

test('we can encrypt and decrpypt a token', t => {
    const chyper = new Chyper({
        seed: 'OMGCAT!',
        iv: 'jf6a4v7v-wftmpm9',
    });
    const secret = 'session:timeout-request:peperone:2000';
    const encrypted = chyper.encrypt(secret);
    t.isEqual(secret, chyper.decrypt(encrypted));
    t.end();
});

test('encrypted tokens are base64 safe URL strings', t => {
    const chyper = new Chyper({
        seed: 'OMGCAT!',
        iv: 'jf6a4v7v-wftmpm9',
    });
    const secret = 'session:timeout-request:peperone:2000';
    const encrypted = chyper.encrypt(secret);
    console.log(encrypted)
    t.true(/^[A-Za-z0-9\-_]+$/.test(encrypted));
    t.end();
});


