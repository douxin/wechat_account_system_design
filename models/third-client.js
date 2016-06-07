/**
 * third client schema
 */

const mongoose = require('../libs/mongoose');
const Schema = mongoose.Schema;

const tSchema = new Schema({
	appId: String,
	appSecret: String,
	callbackUrl: String
});

const ThirdClient = mongoose.model('ThirdClient', tSchema);

module.exports = thirdClient;