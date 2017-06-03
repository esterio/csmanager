const fs = require('fs');
const path = require('path');

let utils = {};

utils.parseConfig = function(configPath) {
    let configRaw, config;
    try {
        configRaw = fs.readFileSync(path.dirname(__dirname) + '/config.json', {
            encoding: 'utf-8',
            flag: 'r'
        });
    } catch (e) {
        console.error(`Cannot open config file ${configPath}`);
        console.error(e);
        process.exit(1);
    }

    try {
        config = JSON.parse(configRaw);
    } catch (e) {
        console.error(`Cannot parse config file ${configPath}`);
        console.error(e);
        process.exit(1);
    }

    return config;
};

utils.formatWithZero = function(number) {
    return ('0' + number).slice(-2)
};

utils.inArray = function(array, val) {
    for (let i = 0, l = array.length; i < l; i++) {
        if (array[i].split(' ')[0] === val) {
            return i;
        }
    }
    return false
};

module.exports = utils;
