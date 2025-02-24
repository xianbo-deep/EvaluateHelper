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

  // 设置注册环境信息
  const registerChannel = channel || scene;
  user.register_env = {
    appid: appId || '',
    uni_platform: this.clientPlatform || '',
    os_name: osName || '',
    app_name: appName || '',
    app_version: appVersion || '',
    app_version_code: appVersionCode || '',
    channel: registerChannel ? registerChannel + '' : '',
    client_ip: clientIP || ''
  };

  user.register_date = Date.now();
  user.dcloud_appid = [appId];

  // 格式化用户名和邮箱
  if (user.username) {
    user.username = user.username.toLowerCase();
  }
  if (user.email) {
    user.email = user.email.toLowerCase();
  }

  const {
    autoSetInviteCode,
    forceInviteCode,
    userRegisterDefaultRole
  } = this.config;

  // 设置邀请码
  if (autoSetInviteCode) {
    user.my_invite_code = await getValidInviteCode();
  }

  // 设置用户角色
  if (userRegisterDefaultRole && userRegisterDefaultRole.length) {
    user.role = Array.from(new Set([...(user.role || []), ...userRegisterDefaultRole]));
  }

  // 判断是否为管理员
  const isAdmin = user.role && user.role.includes('admin');

  // 检查邀请码（仅对普通用户）
  if (forceInviteCode && !isAdmin && !inviteCode) {
    throw {
      errCode: ERROR.INVALID_INVITE_CODE
    };
  }

  // 处理邀请信息
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

  // 登出现有账号
  if (uniIdToken) {
    try {
      await logout.call(this);
    } catch (error) {}
  }

  // 执行注册前钩子
  const beforeRegister = this.hooks.beforeRegister;
  let userRecord = user;
  if (beforeRegister) {
    userRecord = await beforeRegister({
      userRecord,
      clientInfo: this.getUniversalClientInfo()
    });
  }

  // 添加到公共用户表
  const {
    id: uid
  } = await userCollection.add(userRecord);

  // 生成 token
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

  // 根据用户类型存储到对应的表
  const db = uniCloud.database();
  if (isAdmin) {
    // 存储管理员信息
    const adminTable = db.collection('Admin');
    await adminTable.add({
      adminId: uid,
      nickname: user.nickname || '',
      lastLoginTime: Date.now(),
      registerTime: Date.now(),
      account: user.username || user.email || '',
      password: extraData.password || '',
      status: 'active'
    });
  } else {
    // 存储普通用户信息
    const userTable = db.collection('User');
    await userTable.add({
      userId: uid,
      nickname: user.nickname || '',
      avatarUrl: user.avatarUrl || '',
      email: user.email || '',
      registerTime: new Date(user.register_date),
      password: extraData.password || '',
      lastLoginTime: new Date(),
      status: 'active',
      phone: user.mobile || '',
      token: token,
      bio: '',
      memberStatus: 'none',
      membertype: 'none',
      remainingDays: 0,
      remainingTimes: 0,
      usedTrial: false,
      memberStartTime: null,
      memberExpireTime: null
    });

    // 创建用户的初始选择记录
    const selectTable = db.collection('Select');
    let nextId = 1;
    const selectMaxId = await selectTable.orderBy('selectId', 'desc').limit(1).get();
    if (selectMaxId.data.length > 0) {
      nextId = selectMaxId.data[0].selectId + 1;
    }
    await selectTable.add({
      selectId: nextId,
      fileId: "",
      userId: uid,
      packageName: "直播评估",
      packageId: 1,
      timestamp: Date.now()
    });
  }

  // 记录注册日志
  await this.middleware.uniIdLog({
    data: {
      user_id: uid
    },
    type: LOG_TYPE.REGISTER
  });

  // 返回注册结果
  return {
    errCode: 0,
    uid,
    userType: isAdmin ? 'admin' : 'user', // 添加用户类型标识
    newToken: {
      token,
      tokenExpired
    },
    ...(isThirdParty ? await thirdPartyRegister({
      user: {
        ...userRecord,
        _id: uid
      }
    }) : {}),
    passwordConfirmed: !!userRecord.password
  };
}

module.exports = {
  preRegister,
  preRegisterWithPassword,
  postRegister
}
