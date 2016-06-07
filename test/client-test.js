/**
 * third client request test
 */

const Request = require('request');
const JWT = require('jsonwebtolen');

exports.toLogin = function(req, res, next) {

	const token = JWT.sign({
		appId: YOUR_APP_ID
	}, YOUR_APP_SECRET);

	res.redirect(`${ACCOUNT_URL}?token=${token}&redirectUrl=${REDIRECT_URL}&appId=${APP_ID}`);
};