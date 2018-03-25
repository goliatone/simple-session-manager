'use strict';
const extend = require('gextend');
const crypto = require('crypto');
const getGuid = require('./getGuid');
const URLSafeBase64 = require('urlsafe-base64');

const defaults = {
    iv: getGuid(16),
    seed: getGuid(35), 
};

class Chyper {
    constructor(options) {
        // key and iv
        extend(this, defaults, options);
        //vi has to be of lenth 16
        this.key = crypto.createHash('sha256').update(this.seed, 'ascii').digest();
    }

    encrypt(secret) { 
        const cipher = crypto.createCipheriv('aes-256-cbc', this.key, this.iv);
        const out = cipher.update(secret, 'utf8', 'base64');
        return URLSafeBase64.encode(out + cipher.final('base64'));
    }

    decrypt(encrypted) {
        encrypted = URLSafeBase64.decode(encrypted);
        const decipher = crypto.createDecipheriv('aes-256-cbc', this.key, this.iv);
        const out = decipher.update(encrypted, 'base64', 'utf-8');
        return out + decipher.final('utf8');
    }
}
module.exports = Chyper;