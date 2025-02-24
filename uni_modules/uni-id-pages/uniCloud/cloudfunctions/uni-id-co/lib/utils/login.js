const {
  findUser
} = require('./account')
const {
  userCollection,
  LOG_TYPE
} = require('../../common/constants')
const {
  ERROR
} = require('../../common/error')
const {
  logout
} = require('./logout')
const PasswordUtils = require('./password')

async function realPreLogin (params = {}) {
  const {
    user
  } = params
  const appId = this.getUniversalClientInfo().appId
  const {
    total,
    userMatched
  } = await findUser({
    userQuery: user,
    authorizedApp: appId
  })
  if (userMatched.length === 0) {
    if (total > 0) {
      throw {
        errCode: ERROR.ACCOUNT_NOT_EXISTS_IN_CURRENT_APP
      }
    }
    throw {
      errCode: ERROR.ACCOUNT_NOT_EXISTS
    }
  } else if (userMatched.length > 1) {
    throw {
      errCode: ERROR.ACCOUNT_CONFLICT
    }
  }
  const userRecord = userMatched[0]
  checkLoginUserRecord(userRecord)
  return userRecord
}

async function preLogin (params = {}) {
  const {
    user
  } = params
  try {
    const user = await realPreLogin.call(this, params)
    return user
  } catch (error) {
    await this.middleware.uniIdLog({
      success: false,
      data: user,
      type: LOG_TYPE.LOGIN
    })
    throw error
  }
}

async function preLoginWithPassword (params = {}) {
  const {
    user,
    password
  } = params
  try {
    const userRecord = await realPreLogin.call(this, params)
    const {
      passwordErrorLimit,
      passwordErrorRetryTime
    } = this.config
    const {
      clientIP
    } = this.getUniversalClientInfo()
    // 根据ip地址，密码错误次数过多，锁定登录
    let loginIPLimit = userRecord.login_ip_limit || []
    // 清理无用记录
    loginIPLimit = loginIPLimit.filter(item => item.last_error_time > Date.now() - passwordErrorRetryTime * 1000)
    let currentIPLimit = loginIPLimit.find(item => item.ip === clientIP)
    if (currentIPLimit && currentIPLimit.error_times >= passwordErrorLimit) {
      throw {
        errCode: ERROR.PASSWORD_ERROR_EXCEED_LIMIT
      }
    }
    const passwordUtils = new PasswordUtils({
      userRecord,
      clientInfo: this.getUniversalClientInfo(),
      passwordSecret: this.config.passwordSecret
    })

    const {
      success: checkPasswordSuccess,
      refreshPasswordInfo
    } = passwordUtils.checkUserPassword({
      password
    })
    if (!checkPasswordSuccess) {
      // 更新用户ip对应的密码错误记录
      if (!currentIPLimit) {
        currentIPLimit = {
          ip: clientIP,
          error_times: 1,
          last_error_time: Date.now()
        }
        loginIPLimit.push(currentIPLimit)
      } else {
        currentIPLimit.error_times++
        currentIPLimit.last_error_time = Date.now()
      }
      await userCollection.doc(userRecord._id).update({
        login_ip_limit: loginIPLimit
      })
      throw {
        errCode: ERROR.PASSWORD_ERROR
      }
    }
    const extraData = {}
    if (refreshPasswordInfo) {
      extraData.password = refreshPasswordInfo.passwordHash
      extraData.password_secret_version = refreshPasswordInfo.version
    }

    const currentIPLimitIndex = loginIPLimit.indexOf(currentIPLimit)
    if (currentIPLimitIndex > -1) {
      loginIPLimit.splice(currentIPLimitIndex, 1)
    }
    extraData.login_ip_limit = loginIPLimit
    return {
      user: userRecord,
      extraData
    }
  } catch (error) {
    await this.middleware.uniIdLog({
      success: false,
      data: user,
      type: LOG_TYPE.LOGIN
    })
    throw error
  }
}

function checkLoginUserRecord (user) {
  switch (user.status) {
    case undefined:
    case 0:
      break
    case 1:
      throw {
        errCode: ERROR.ACCOUNT_BANNED
      }
    case 2:
      throw {
        errCode: ERROR.ACCOUNT_AUDITING
      }
    case 3:
      throw {
        errCode: ERROR.ACCOUNT_AUDIT_FAILED
      }
    case 4:
      throw {
        errCode: ERROR.ACCOUNT_CLOSED
      }
    default:
      break
  }
}

async function postLogin(params = {}) {
  const {
    user,
    extraData,
    isThirdParty = false
  } = params;
  const { clientIP } = this.getUniversalClientInfo();
  const uniIdToken = this.getUniversalUniIdToken();
  const uid = user._id;
  
  // 检查是否为管理员
  const db = uniCloud.database();
  const adminTable = db.collection('Admin');
  const adminUser = await adminTable.where({ adminId: uid }).get();
  
  // 检查是否为普通用户
  const userTable = db.collection('User');
  const normalUser = await userTable.where({ userId: uid }).get();
  
  // 判断用户类型和状态
  let userType = null;
  if (adminUser.data.length > 0) {
    userType = 'admin';
    // 检查管理员状态
    if (adminUser.data[0].status !== 'active') {
      throw {
        errCode: 'ADMIN_ACCOUNT_BANNED',
        errMsg: '管理员账号已被禁用'
      };
    }
  } else if (normalUser.data.length > 0) {
    userType = 'user';
    // 检查用户状态
    if (normalUser.data[0].status !== 'active') {
      throw {
        errCode: 'USER_ACCOUNT_BANNED',
        errMsg: '用户账号已被禁用'
      };
    }
  } else {
    // 新用户，默认为普通用户
    userType = 'user';
  }

  // 生成新的登录 Token
  const createTokenRes = await this.uniIdCommon.createToken({
    uid
  });
  const { errCode, token, tokenExpired } = createTokenRes;
  if (errCode) {
    throw createTokenRes;
  }

  // 如果存在之前的 Token，进行登出
  if (uniIdToken) {
    try {
      await logout.call(this);
    } catch (error) {}
  }

  const now = Date.now();

  if (userType === 'admin') {
    // 更新管理员信息
    await adminTable.where({ adminId: uid }).update({
      lastLoginTime: now,
      ...(extraData.password ? { password: extraData.password } : {})
    });
  } else if (userType === 'user') { // 明确指定只有普通用户才处理这部分
    // 处理普通用户
    if (normalUser.data.length > 0) {
      // 更新已存在用户
      await userTable.doc(normalUser.data[0]._id).update({
        lastLoginTime: now,
        token: token,
        ...(extraData.password ? { password: extraData.password } : {})
      });
    } else {
      // 创建新用户
      await userTable.add({
        userId: uid,
        nickname: user.nickname || '',
        avatarUrl: user.avatarUrl || '',
        email: user.email || '',
        registerTime: new Date(user.register_date || now),
        password: extraData.password || '',
        lastLoginTime: new Date(now),
        status: 'active',
        phone: user.mobile || '',
        token: token,
        memberStatus: 'none',
        membertype: 'none',
        remainingDays: 0,
        remainingTimes: 0,
        bio: '',
        usedTrial: false
      });
    }
  }if (userType === 'admin') {
  // 更新管理员信息
  await adminTable.where({ adminId: uid }).update({
    lastLoginTime: now,
    ...(extraData.password ? { password: extraData.password } : {})
  });
} else if (userType === 'user') { // 明确指定只有普通用户才处理这部分
  // 处理普通用户
  if (normalUser.data.length > 0) {
    // 更新已存在用户
    await userTable.doc(normalUser.data[0]._id).update({
      lastLoginTime: now,
      token: token,
      ...(extraData.password ? { password: extraData.password } : {})
    });
  } else {
    // 创建新用户
    await userTable.add({
      userId: uid,
      nickname: user.nickname || '',
      avatarUrl: user.avatarUrl || '',
      email: user.email || '',
      registerTime: new Date(user.register_date || now),
      password: extraData.password || '',
      lastLoginTime: new Date(now),
      status: 'active',
      phone: user.mobile || '',
      token: token,
      memberStatus: 'none',
      membertype: 'none',
      remainingDays: 0,
      remainingTimes: 0,
      bio: '',
      usedTrial: false
    });
  }
}

  // 更新通用用户集合
  await userCollection.doc(uid).update({
    last_login_date: now,
    last_login_ip: clientIP,
    ...extraData
  });

  // 记录登录日志
  await this.middleware.uniIdLog({
    data: {
      user_id: uid
    },
    type: LOG_TYPE.LOGIN
  });

  // 返回登录结果
  return {
    errCode: 0,
    newToken: {
      token,
      tokenExpired
    },
    uid,
    userType, // 添加用户类型标识
    ...(isThirdParty ? await thirdPartyLogin({ user }) : {}),
    passwordConfirmed: !!user.password
  };
}
async function postLogin(params = {}) {
  const {
    user,
    extraData,
    isThirdParty = false
  } = params;
  const { clientIP } = this.getUniversalClientInfo();
  const uniIdToken = this.getUniversalUniIdToken();
  const uid = user._id;
  
  // 首先检查用户在 User 表中的状态
  const db = uniCloud.database();
  const userTable = db.collection('User');
  const existingUser = await userTable.where({ userId: uid }).get();
  
  // 如果用户存在且状态不是 active，拒绝登录
  if (existingUser.data.length > 0 && existingUser.data[0].status !== 'active') {
    throw {
      errCode: 'USER_ACCOUNT_BANNED',
      errMsg: '账号已被禁用'
    };
  }

  // 更新用户最后登录时间和 IP
  const updateData = {
    last_login_date: Date.now(),
    last_login_ip: clientIP,
    ...extraData
  };

  // 生成新的登录 Token
  const createTokenRes = await this.uniIdCommon.createToken({
    uid
  });
  const { errCode, token, tokenExpired } = createTokenRes;
  if (errCode) {
    throw createTokenRes;
  }

  // 如果存在之前的 Token，进行登出
  if (uniIdToken) {
    try {
      await logout.call(this);
    } catch (error) {}
  }

  // 更新原始用户表中的数据
  await userCollection.doc(uid).update(updateData);

  // 更新或创建 User 表中的记录
  if (existingUser.data.length > 0) {
    // 用户已存在，更新登录信息
    await userTable.doc(existingUser.data[0]._id).update({
      lastLoginTime: Date.now(),
      token: token,
      ...(extraData.password ? { password: extraData.password } : {})
    });
  } else {
    // 用户不存在，创建新记录
    await userTable.add({
      userId: uid,
      nickname: user.nickname || '',
      avatarUrl: user.avatarUrl || '',
      email: user.email || '',
      registerTime: user.register_date || Date.now(),
      password: extraData.password || '',
      lastLoginTime: Date.now(),
      status: 'active',
      phone: user.mobile || '',
      token: token,
      memberStatus: 'none',
      membertype: 'none',
      remainingValue: 0,
      bio: ''
    });
  }

  // 记录登录日志
  await this.middleware.uniIdLog({
    data: {
      user_id: uid
    },
    type: LOG_TYPE.LOGIN
  });

  // 返回登录结果
  return {
    errCode: 0,
    newToken: {
      token,
      tokenExpired
    },
    uid,
    ...(
      isThirdParty
        ? thirdPartyLogin({
          user
        })
        : {}
    ),
    passwordConfirmed: !!user.password
  };
}

module.exports = {
  preLogin,
  postLogin,
  checkLoginUserRecord,
  preLoginWithPassword
}
