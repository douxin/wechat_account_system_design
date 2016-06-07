/**
 * user service
 */

const Model = require('../models');
const UserModel = Model.User;
const co = require('co');

class User {

	constructor(openId) {
		this.openId = openId;
	}

	/**
	 * find by openId
	 */
	getUser() {
		return UserModel.findOne({
			openId: this.openId
		}).exec();
	}

	/**
	 * update user
	 * @param currentUser 本地查询到的 user record
	 * @param userObj 微信服务器获取的最新的 user info
	 */
	static updateUser(currentUser, userObj) {
		currentUser.avatar = userObj.headimgurl;
		currentUser.nickName = userObj.nickName;
		currentUser.province = userObj.province;
		currentUser.city = userObj.city;
		currentUser.country = userObj.country;
		currentUser.sex = userObj.sex;
		currentUser.unionId = userObj.unionid || "";
		return currentUser.save().exec();
	}

	/**
	 * add a new user record
	 * @param userObj 微信服务器获取的 user info
	 */
	static saveUser(userObj) {
		const user = new UserModel({
			openId: userObj.openid,
			avatar: userObj.headimgurl,
			nickName: userObj.nickname,
			province: userObj.procince,
			city: userObj.city,
			country: userObj.country,
			sex: userObj.sex,
			unionId: userObj.unionid || ""
		});
		return user.save().exec();
	}

};

module.exports = User;