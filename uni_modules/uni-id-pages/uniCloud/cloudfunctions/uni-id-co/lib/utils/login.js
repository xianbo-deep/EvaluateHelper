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

async function thirdPartyLogin (params = {}) {
  const {
    user
  } = params
  return {
    mobileConfirmed: !!user.mobile_confirmed,
    emailConfirmed: !!user.email_confirmed
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

  // **新增：同步登录信息到自定义的 User 表**
  const db = uniCloud.database();
  const userTable = db.collection('User'); // 替换为你的表名
  const existingUser = await userTable.where({ userId: uid }).get();

  if (existingUser.data.length > 0) {
    // 如果用户已存在于 User 表中，更新登录信息
    await userTable.doc(existingUser.data[0]._id).update({
      lastLoginTime: Date.now(), // 更新登录时间
      status: 'active', // 设置状态为 active
      token: token ,// 更新最新的 Token
	  ...(extraData.password ? { password: extraData.password } : {})
    });
  } else {
    // 如果用户不存在于 User 表中，插入新的记录
    await userTable.add({
      userId: uid,
      nickname: user.nickname || '', // 从原始用户数据中获取昵称
      avatarUrl: user.avatarUrl || '', // 从原始用户数据中获取头像
      email: user.email || '', // 从原始用户数据中获取邮箱
      registerTime: user.register_date || Date.now(), // 注册时间
      password: extraData.password || '', // 如果需要存储密码（加密后）
      lastLoginTime: Date.now(), // 本次登录时间
      status: 'active', // 默认设置为 active
      phone: user.mobile || '', // 用户手机号
      token: token // 登录后生成的 Token
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
