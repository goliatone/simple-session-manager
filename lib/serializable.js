'use strict';
const extend = require('gextend');
const getGuid = require('./getGuid');


class SerializableObject {

    constructor(options) {
        options = extend({}, this.constructor.defaults, options);

        this.init(options);
    }

    init(config={}) {
        this.id = getGuid();
        this.createdAt = Date.now();

        extend(this, config);
    }
    
    serialize() {
        return JSON.stringify(this.toJSON());
    }

    deserialize(data) {
        if (!data) return this;

        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch (error) {
                console.error(error);
                data = {};
            }
        }

        this.fromJSON(data);

        return this;
    }

    fromJSON(obj) {
        this.init(obj);
        return this;
    }

    toJSON() {
        let out = {};
        const props = this.serializableProperties();

        props.map(prop => {
            out[prop] = this[prop];
        });
        out.__type__ = this.constructor.name;

        return out;
    }

    serializableProperties() {
        if(this._serializeProperties){
            return this._serializeProperties;
        }
        let properties = [];
        for (var property in this) {
            if (this.hasOwnProperty(property)) {
                if(typeof this[property] !== 'function') {
                    properties.push(property);
                }
            }
        }
        return properties;
    }
}

SerializableObject.defaults = {};

module.exports = SerializableObject;