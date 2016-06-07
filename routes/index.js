var express = require('express');
var router = express.Router();

const ctrl = require('../controllers/user');

// 第三方客户端请求的接口
router.get('/account/auth', ctrl.verifyClient, ctrl.verifyToken, toAuth);

// 微信回调接口
router.get('/account/oauth/callback', ctrl.OAuthCallback, backToThirdClient);

module.exports = router;
