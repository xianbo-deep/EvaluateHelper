const {
  userCollection,
  LOG_TYPE
} = require('../../common/constants')
const {
  ERROR
} = require('../../common/error')
const {
  findUser
} = require('./account')
const {
  getValidInviteCode,
  generateInviteInfo
} = require('./fission')
const {
  logout
} = require('./logout')
const PasswordUtils = require('./password')
const { 
  merge
} = require('../npm/index')

async function realPreRegister (params = {}) {
  const {
    user
  } = params
  const {
    userMatched
  } = await findUser({
    userQuery: user,
    authorizedApp: this.getUniversalClientInfo().appId
  })
  if (userMatched.length > 0) {
    throw {
      errCode: ERROR.ACCOUNT_EXISTS
    }
  }
}

async function preRegister (params = {}) {
  try {
    await realPreRegister.call(this, params)
  } catch (error) {
    await this.middleware.uniIdLog({
      success: false,
      type: LOG_TYPE.REGISTER
    })
    throw error
  }
}

async function preRegisterWithPassword (params = {}) {
  const {
    user,
    password
  } = params
  await preRegister.call(this, {
    user
  })
  const passwordUtils = new PasswordUtils({
    clientInfo: this.getUniversalClientInfo(),
    passwordSecret: this.config.passwordSecret
  })
  const {
    passwordHash,
    version
  } = passwordUtils.generatePasswordHash({
    password
  })
  const extraData = {
    password: passwordHash,
    password_secret_version: version
  }
  return {
    user,
    extraData
  }
}

async function thirdPartyRegister ({
  user = {}
} = {}) {
  return {
    mobileConfirmed: !!(user.mobile && user.mobile_confirmed) || false,
    emailConfirmed: !!(user.email && user.email_confirmed) || false
  }
}

async function postRegister(params = {}) {
  const {
    user,
    extraData = {},
    isThirdParty = false,
    inviteCode
  } = params;

  const {
    appId,
    appName,
    appVersion,
    appVersionCode,
    channel,
    scene,
    clientIP,
    osName
  } = this.getUniversalClientInfo();
  const uniIdToken = this.getUniversalUniIdToken();

  merge(user, extraData);

  const registerChannel = channel || scene;
  user.register_env = {
    appid: appId || '',
    uni_platform: this.clientPlatform || '',
    os_name: osName || '',
    app_name: appName || '',
    app_version: appVersion || '',
    app_version_code: appVersionCode || '',
    channel: registerChannel ? registerChannel + '' : '', // channel可能为数字，统一存为字符串
    client_ip: clientIP || ''
  };

  user.register_date = Date.now();
  user.dcloud_appid = [appId];

  if (user.username) {
    user.username = user.username.toLowerCase();
  }
  if (user.email) {
    user.email = user.email.toLowerCase();
  }

  const {
    autoSetInviteCode, // 注册时自动设置邀请码
    forceInviteCode, // 必须有邀请码才允许注册，注意此逻辑不可对admin生效
    userRegisterDefaultRole // 用户注册时配置的默认角色
  } = this.config;
  if (autoSetInviteCode) {
    user.my_invite_code = await getValidInviteCode();
  }

  // 如果用户注册默认角色配置存在且不为空数组
  if (userRegisterDefaultRole && userRegisterDefaultRole.length) {
    // 将用户已有的角色和配置的默认角色合并成一个数组，并去重
    user.role = Array.from(new Set([...(user.role || []), ...userRegisterDefaultRole]));
  }

  const isAdmin = user.role && user.role.includes('admin');

  if (forceInviteCode && !isAdmin && !inviteCode) {
    throw {
      errCode: ERROR.INVALID_INVITE_CODE
    };
  }

  if (inviteCode) {
    const {
      inviterUid,
      inviteTime
    } = await generateInviteInfo({
      inviteCode
    });
    user.inviter_uid = inviterUid;
    user.invite_time = inviteTime;
  }

  if (uniIdToken) {
    try {
      await logout.call(this);
    } catch (error) {}
  }

  const beforeRegister = this.hooks.beforeRegister;
  let userRecord = user;
  if (beforeRegister) {
    userRecord = await beforeRegister({
      userRecord,
      clientInfo: this.getUniversalClientInfo()
    });
  }

  const {
    id: uid
  } = await userCollection.add(userRecord);

  const createTokenRes = await this.uniIdCommon.createToken({
    uid
  });

  const {
    errCode,
    token,
    tokenExpired
  } = createTokenRes;

  if (errCode) {
    throw createTokenRes;
  }

  // **将注册信息存入自定义的 User 表**
  const db = uniCloud.database();
  const userTable = db.collection('User'); // 替换为你的表名
  await userTable.add({
    userId: uid, // 用户唯一标识
    nickname: user.nickname || '', // 默认空字符串
    avatarUrl: user.avatarUrl || '', // 默认空字符串
    email: user.email || '', // 默认空字符串
    registerTime: user.register_date, // 使用注册时间
    password: extraData.password || '', // 加密后的密码
    lastLoginTime: null, // 初次注册，没有登录时间
    status: 'active', // 默认状态为 active
    phone: user.mobile || '', // 手机号
    token: token // 注册后生成的 token
  });
  const selectTable = db.collection('Select');
    let nextId = 1;
    const selectMaxId = await selectTable.orderBy('selectId', 'desc').limit(1).get();
    if (selectMaxId.data.length > 0) {
      nextId = selectMaxId.data[0].selectId + 1;
    }
	const indicators = Array.from({ length: 7 }, (_, index) => ({
	  metricId: (index + 1).toString(),
	  metricname: `指标${index + 1}`,
	  description: `描述${index + 1}`
	}));
	await selectTable.add({
	  selectId: nextId,
	  fileId: "",
	  userId: uid,
	  indicators: indicators, 
	  timestamp: Date.now()
  });
  await this.middleware.uniIdLog({
    data: {
      user_id: uid
    },
    type: LOG_TYPE.REGISTER
  });

  return {
    errCode: 0,
    uid,
    newToken: {
      token,
      tokenExpired
    },
    ...(
      isThirdParty
        ? thirdPartyRegister({
          user: {
            ...userRecord,
            _id: uid
          }
        })
        : {}
    ),
    passwordConfirmed: !!userRecord.password
  };
}


module.exports = {
  preRegister,
  preRegisterWithPassword,
  postRegister
}
