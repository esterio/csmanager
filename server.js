"use strict";

const path = require('path');
const child_process = require('child_process');

class Server {
    constructor(config, event) {
        this.isStarted = false;
        this.inProgress = false;
        this.error = '';

        this.onClose = this.onClose.bind(this);
        this.onError = this.onError.bind(this);
        this.stdError = this.stdError.bind(this);
        this.rejectError = this.rejectError.bind(this);
        this.resolveSuccess = this.resolveSuccess.bind(this);

        Object.defineProperty(this, 'event', {
            value: event,
            writable: false
        });

        console.log(event)

        const cwd = path.dirname(config.path);

        let options = {
            command: config.path,
            args: config.args,
            options: {},
        };
        options.options.cwd = cwd;
        options.options.env = Object.create(process.env);
        if (process.env.LD_LIBRARY_PATH) {
            options.options.env.LD_LIBRARY_PATH = cwd + ':' + process.env.LD_LIBRARY_PATH;
        } else {
            options.options.env.LD_LIBRARY_PATH = cwd;
        }
        options.stdio = ['ignore', 'ignore', 'ignore'];

        Object.defineProperty(this, 'options', {
            value:  options,
            writable: false
        });

        Object.defineProperty(this, 'timeout', {
            value:  config.timeout || 5000,
            writable: false
        });
    }

    onClose(code, signal) {
        if (signal !== 'SIGKILL' && code !== 0) {
            this.rejectError(this.error);
            this.event.call(null, 'crashed', this);
        } else {
            this.resolveSuccess();
            this.event.call(null, 'stopped', this);
        }
        this.isStarted = false;
        this.inProgress = false;
        this.child = null;
        this.error = '';


        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }

    onError(error) {
        this.rejectError(2, error);
    }

    stdError(data) {
        this.error += data;
    }

    rejectError(error) {
        if (this.reject) {
            this.reject(error);
        }
        this.reject = null;
        this.resolve = null;
    }

    resolveSuccess() {
        if (this.resolve) {
            this.resolve(this);
        }
        this.reject = null;
        this.resolve = null;
    }

    start() {

        return new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
            try {
                if (this.isStarted) {
                    throw new Error('Server already started');
                }
                if (this.inProgress) {
                    throw new Error('Server is busy with another task');
                }
                this.inProgress = true;
                console.log(this.options.command, this.options.args, this.options.options)
                this.child = child_process.spawn(this.options.command, this.options.args, this.options.options);
                this.child.on('close', this.onClose).on('error', this.onError);

                this.timer = setTimeout(() => {
                    this.isStarted = true;
                    this.inProgress = false;
                    this.event.call(null, 'started', this);
                }, this.timeout);

                this.child.stderr.setEncoding('utf8').on('data', this.stdError);
                this.resolveSuccess(this);
            } catch (error) {
                this.inProgress = false;
                this.rejectError(error);
            }
        });
    }

    stop() {
        return Promise.all([
            this.execute('quit'),
            (new Promise((resolve, reject) => {
                this.timer = setTimeout(() => {
                    this.inProgress = false;
                    this.child.kill('SIGKILL');
                    this.resolveSuccess(this);
                    this.event.call(null, 'stopped', this);
                }, 10000);
            }))
        ]);
    }

    execute(command) {
        return new Promise((resolve, reject) => {
            try {
                if (this.isStarted) {
                    throw new Error('Server not started');
                }
                if (this.inProgress) {
                    throw new Error('Server is busy with another task');
                }
                this.inProgress = true;
                this.child.stdin.cork();
                this.child.stdin.write(command + '\n');
                this.child.stdin.uncork();
                this.inProgress = false;
                this.resolveSuccess(this);
                this.event.call(null, 'executed', this);
            } catch (error) {
                this.inProgress = false;
                this.rejectError(error);
            }
        });
    }
}

