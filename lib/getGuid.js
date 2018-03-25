'use strict';

module.exports = function getGuid(len=20) {
    const timestamp = (new Date()).getTime().toString(36);
    
    const randomString = (len) => [...Array(len)].map(() => Math.random().toString(36)[3]).join('');
    const tl = timestamp.length + 1;
    len = Math.max(len - tl, tl);
    
    return `${timestamp}-${randomString(len)}`;
};