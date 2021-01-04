var nano = require('nano'),
    config = require('../config/config.json');

module.exports = nano(config.couchdb);