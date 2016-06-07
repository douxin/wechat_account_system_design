/**
 * 微信 user oauth
 */

const WechatOAuthApi = require('../../libs/wechat-oauth');
const Request = require('request');
const Config = require('../../config');

class UserOAuth {

	constructor(code) {
		this.code = code;
	}

	/**
	 * 商城 oauth url, 客户端直接跳转至此链接进行微信授权
	 */
	static getOAuthUrl(redirectUri, state, scope) {
		return WechatOAuthApi.getAuthorizeURL(redirectUri, this.state, scope);
	}

    /**
     * 根据 code 换取 token
     */
	getToken() {
		return new Promise((resolve, reject) => {
			const apiUrl = "https://api.weixin.qq.com/sns/oauth2/access_token";
			const requestUrl = `${apiUrl}?appid=${Config.wechatmp.appId}&secret=${Config.wechatmp.appSecret}&code=${this.code}&grant_type=authorization_code`;
			Request(requestUrl, (error, response, body) => {
				if (!error && respons.statusCode === 200) {
					resolve(JSON.parse(body));
				} else {
					reject(error);
				}
			});
		});
	}

    /**
     * 根据 accessToken, openId, lang 换取用户信息
     */
	getUser(accessToken, openId, lang) {
		return new Promise((resolve, reject) => {
			const apiUrl = "https://api.weixin.qq.com/sns/userinfo";
			const reqUrl = `${apiUrl}?access_token=${accessToken}&openid=${openId}&lang=${lang}`;
			Request(reqUrl, (error, response, body) => {
				if (!error && response.statusCode === 200) {
					if (body && body.errorcode) {
						reject(new Error(body));
					} else {
						resolve(JSON.parse(body));
					}
				} else {
					reject(error);
				}
			});
		});
	}
};

module.exports = UserOAuth;