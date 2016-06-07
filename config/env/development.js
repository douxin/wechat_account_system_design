"use strict";

const config = {};

// mongoose
config.mongo = {
	host: 'HOST',
	port: 'PORT',
	db: 'DB'
};

// wechat mp
config.wechatmp = {
	appId: 'APPID',
	appSecret: 'APPSECRET',
	oAuthCallbackUrl: 'CALLBACKURL',
	scope: 'SCOPE'
};

module.exports = config;