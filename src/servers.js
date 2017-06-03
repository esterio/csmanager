"use strict";

const EventEmitter = require('events');

const Server = require('./server');

class Servers extends EventEmitter {
    constructor(config) {
        super();
        this.servers = {};
        this.onEvent = this.onEvent.bind(this);

        Object.keys(config).forEach((key) => {
            this.servers[key] = Server(config[key], this.onEvent);
        });
    }

    onEvent() {
        this.emit.apply(this, arguments);
    }

    start() {
        Object.keys(this.servers).forEach((key) => {
            this.servers[key].start();
        });
    }
}

module.exports = function (config) {
    return new Servers(config);
};
