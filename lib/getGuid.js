'use strict';

module.exports = function getGuid(length = 20) {
    function rand(length = 25) {
        if (!length) {
            return '';
        }

        const possible =
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        let array = new Array(length);

        for (let i = 0; i < length; i++) {
            array[i] = Math.floor(Math.random() * 62);
        }

        for (let i = 0; i < length; i++) {
            result += possible.charAt(array[i] % 62);
        }

        return result;
    }

    function token(length = 25) {
        return rand(length); // to make it longer
    }

    return token(length);
};
