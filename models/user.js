/**
 * merchant schema
 */

const mongoose = require('../libs/mongoose');
const Schema = mongoose.Schema;
const timestamps = require('mongoose-timestamp');

const userSchema = new Schema({
	openId: String,
	avatar: String,
	nickName: String,
	province: String,
	city: String,
	country: String,
	sex: Number,
	unionId: String,
});

userSchema.plugin(timestamps);

const User = mongoose.model('User', userSchema);

module.exports = User;