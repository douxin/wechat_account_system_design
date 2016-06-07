/**
 * wechat oauth config
 */

const Config = require('../config');
const WechatOAuth = require('wechat-oauth');
const Model = require('../models');
const WechatOAuthTokenModel = Model.WechatOAuthToken;

const client = new WechatOAuth(Config.wechatmp.appId, 
	Config.wechatmp.appSecret, (openId, cb) => {
		// get token
		WechatOAuthTokenModel.findOne({
			openId: openId
		}).exec().then(ret => {
			cb(null, ret.token);
		}, err => {
			cb(err);
		});
	}, (openId, token, cb) => {
		// save token
		WechatOAuthTokenModel.findOne({
			openId: openId
		}).exec().then(data => {
			if (data) {
				// update
				data.token = token;
				data.save().exec().then(ret => {
					cb(null);
				}, err => {
					cb(err);
				});
			} else {
				// add new one
				const newData = new WechatOAuthTokenModel({
					openId: openId,
					token: token
				});
				newData.save().exec().then(newRet => {
					cb(null);
				}, err => {
					cb(err);
				});
			}
		})
	});

module.exports = client;