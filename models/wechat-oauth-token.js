/**
 * wechat oauth token schema
 */

const mongoose = require('../libs/mongoose');
const Schema = mongoose.Schema;
const timestamps = require('mongoose-timestamp');

const wSchema = new Schema({
	openId: String,
	token: Schema.Types.Mixed
});

// merchantSchema.plugin(timestamps);

const WechatOAuthToken = mongoose.model('WechatOAuthToken', wSchema);

module.exports = WechatOAuthToken;