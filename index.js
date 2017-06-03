const Servers = require('./src/servers');
const Utils = require('./src/utils');

const config = Utils.parseConfig(__dirname + '/config.json');

const servers = Servers(config.servers);

servers.start();
