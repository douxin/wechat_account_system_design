# 微信公众号统一账户系统

做过微信公众号开发的朋友都遇到这样一个实际问题，因为公众号的开发模式只能对接一个服务器接口地址，这就使的如果公司的业务比较多，那么就很难每个业务都直接对接到微信公众平台。而我们日常的需求中，这种情况是很普遍的一个现场。

以我们公司为例，我们是个创业公司，经常会有一些小创意，一般来说这些创意都需要获取用户的微信信息，如姓名、头像等；如果我需要把每个新创意都替换到公众号开发模式的接口的话，那么我之前的业务就没法使用了。这种现场在很多公司都实际存在。

今天这篇文章就来设计个方案解决这个问题。

主体的方案就是，设计一个统一账户系统（下称 **account api**），公司的所有业务都通过 appId, appSecret 的方式对接到 account api 上，用户 oAuth 认证的业务全部交由 account api 来完成；为了保证业务系统和 account api 之间的安全问题，采用 jsonwebtoken 认证方案。这样，我们仅把 account api 对接到微信公众号即可。

> 注：本例子使用 NodeJS 作为代码说明，同时下面的代码并没有在进行过测试，并不能直接在生产环境上使用，请读者根据思路自行进行测试和整理

## 生成项目
```
➜  mkdir account_system
➜  cd account_system
➜  express
➜  npm i
➜  npm i --save wechat-oauth jsonwebtoken mongoose mongoose-timestamp request
```

## 项目结构说明

```
.
├── README.md
├── app.js
├── bin
├── config
├── controllers  // ctrl 文件，主体的流程在该目录下
├── libs  // 对 mongoose、wechat-oauth 进行了配置
├── models  // 数据库设计
├── node_modules
├── package.json
├── public
├── routes  // 路由
├── services  // services
├── test
└── views
```

## account api 接口设计
account api 主要提供下面两个接口

```
const ctrl = require('../controllers/user');
router.get('/account/auth', ctrl.verifyClient, ctrl.verifyToken, toAuth); // 第三方客户端请求的接口
router.get('/account/oauth/callback', ctrl.OAuthCallback, backToThirdClient); // 微信回调接口
```

## 业务系统请求用户信息
我们给业务系统分配 appId, appSecret 并记录在数据库中

```
const tSchema = new Schema({
	appId: String,
	appSecret: String,
	callbackUrl: String  // 业务系统请求时，需要提供回调地址
});

const ThirdClient = mongoose.model('ThirdClient', tSchema);
module.exports = thirdClient;
```

业务系统在请求时，使用分配的 appSecret 加密 appId，并提供回调地址

```
const JWT = require('jsonwebtolen');

exports.toLogin = function(req, res, next) {

	const token = JWT.sign({
		appId: YOUR_APP_ID
	}, YOUR_APP_SECRET);

	res.redirect(`${ACCOUNT_URL/account/auth}?token=${token}&redirectUrl=${REDIRECT_URL}&appId=${APP_ID}`);
};
```

## account api 对业务系统的请求进行验证
先查找本地业务系统记录

```
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
```

再对业务系统的 token 进行认证

```
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
```

全部认证通过后，进行微信授权，我们将业务系统的记录 ID 设置为 state, 这样在微信回调后我们就可以找到对应的业务系统了

```
exports.toAuth = function(req, res, next) {
	const client = req.client;

	const url = WechatOAuthService.getOAuthUrl(Config.wechatmp.oAuthCallbackUrl, client.id, Config.wechatmp.scope);
	redirect(url);
}
```

## 微信授权
通过微信 OAuth 授权，可以获取当前用户的信息。
微信授权主要分为三步：

    1. 获取 code
    2. 根据 code 获取 access_token, openid
    3. 根据第 2 步获取的内容去微信获取用户完整信息

```
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
```

微信回调后，我们依次使用上面的方法，获取到当前用户的微信信息，然后我们将其记录（或更新）在数据库中

```
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
```

## 数据返回业务系统
通过 state 我们可以找到对应的业务系统数据，我们使用业务系统的 appSecret 对用户数据进行加密，并回调业务系统

```
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
```

## 总结
至此，我们完成了 account api 的完整设计，因为代码在写的时候比较仓促，仅为说明思路，所以并没有进行测试，读者朋友可以自行进行整理和测试；

详细代码，我已经上传到 Github, 地址：