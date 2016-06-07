/**
 * user controllers
 */

const Service = require('../services');
const UserService = Service.User;
const WechatOAuthService = Service.WechatOAuth;
const UserService = Service.User;
const Model = require('../models');
const ThirdClientModel = Model.ThirdClientModel;
const co = require('co');
const Config = require('../config/env');
const JWT = require('jsonwebtoken');

/**
 * 微信 oauth callback
 */
exports.OAuthCallback = function(req, res, next) {
	const code = req.query.code;

	co(function* () {

		// query user info from wechat server
		const wechatOAuthSecvice = new WechatOAuthService(code);
		const accessToken = yield wechatOAuthSecvice.getToken();
		const userFromWechat = yield wechatOAuthSecvice.getUser(accessToken.access_token, accessToken.openid, 'zh_CN');

		// query user info from local database
		const userService = new User(userFromWechat.openid);
		const userFromLocal = userService.getUser();

		// update if exist, else add new one
		if (userFromLocal) {
			return yield UserService.updateUser(userFromLocal, userFromWechat);
		} else {
			return yield UserService.saveUser(userFromWechat);
		}
	}).then(ret => {
		req.user = ret;
		next();
	}, err => {
		next(err);
	});
};

/**
 * redirect to third client
 */
exports.backToThirdClient = function(req, res, next) {
	const user = req.user;
	const state = req.query.state;

	co(function* () {
		// query third client record
		const client = yield ThirdClientModel.findById(state).exec();

		if (client && client.callbackUrl) {
			const token = yield JWT.sign({
				appId: client.appId,
				user: user
			}, client.appSecret);
			return yield Promise.resolve({
				callbackUrl: client.callbackUrl,
				token: token
			});
		} else {
			return yield Promise.reject(new Error('third client not exist'));
		}
	}).then(ret => {
		redirect(`${ret.callbackUrl}?token=${ret.token}`);
	}, err => {
		next(err);
	})
};

/**
 * verify client exist
 */
exports.verifyClient = function(req, res, next) {
	const appId = req.query.appId;
	
	ThirdClientModel.findOne({
		appId: appId
	}).exec().then(ret => {
		if (ret) {
			req.client = ret;
			next();
		} else {
			res.send({
				code: 0,
				msg: 'your appId not exist, please contact to your system administrator'
			});
		}
	}, err => {
		next(err);
	})
};

/**
 * verify client token
 */
exports.verifyToken = function(req, res, next) {
	const token = req.query.token;
	const client = req.client;
	const redirectUrl = req.query.redirectUrl;

	JWT.verify(token, client.appSecret, (err, decoded) => {
		if (err) {
			next(err);
		} else {
			// verify passed
			if (decoded.appId === client.appId) {
				client.redirectUrl = redirectUrl;
				client.save().exec().then(ret => {
					req.client = ret;
					next();
				}, err => {
					next(err);
				})
			} else {
				next(new Error('appId not match'));
			}
			
		}
	})
}

/**
 * 认证
 */
exports.toAuth = function(req, res, next) {
	const client = req.client;

	const url = WechatOAuthService.getOAuthUrl(Config.wechatmp.oAuthCallbackUrl, client.id, Config.wechatmp.scope);
	redirect(url);
}