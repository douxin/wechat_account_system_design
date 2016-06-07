/**
 * config mongoose
 */

const mongoose = require('mongoose');
const config = require('../config');

const uri = `mongodb://${config.mongo.username}:${config.mongo.password}@${config.mongo.host}:${config.mongo.port}/${config.mongo.dbName}`;
const options = {
	server: {
		poolSize: 5
	}
};

mongoose.connect(uri, options);

module.exports = mongoose;