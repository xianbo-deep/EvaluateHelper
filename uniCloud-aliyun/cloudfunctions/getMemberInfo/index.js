'use strict';

const db = uniCloud.database();

exports.main = async (event, context) => {
  const { userId } = event;
  
  if (!userId) {
    return {
      code: 1,
      message: '用户ID不能为空'
    };
  }

  try {
    // 获取用户会员信息
    const userResult = await db.collection('User')
      .where({userId: userId})
      .field({
        memberStatus: 1,
        membertype: 1,
        remainingTimes: 1,
		remainingDays: 1,
		usedTrial: 1,
		memberExpireTime: 1
      })
      .get();

    if (!userResult.data || userResult.data.length === 0) {
      return {
        code: 1,
        message: '用户不存在'
      };
    }

    const memberInfo = userResult.data[0];
    
    // 检查会员是否过期
    if (memberInfo.memberStatus === 'active' && memberInfo.memberExpireTime) {
      if (memberInfo.memberExpireTime < Date.now()) {
        // 会员已过期，更新状态
        await db.collection('User')
          .where({userId: userId})
          .update({
            memberStatus: 'expired',
			membertype: 'none',
            memberExpireTime: null
          });
          
        memberInfo.memberStatus = 'expired';
        memberInfo.memberExpireTime = null;
      }
    }

    return {
      code: 0,
      message: '获取成功',
      data: memberInfo
    };
  } catch (error) {
    console.error('获取会员信息失败:', error);
    return {
      code: 1,
      message: '获取会员信息失败'
    };
  }
};