'use strict';
const db = uniCloud.database();
const dbCmd = db.command;

exports.main = async (event, context) => {
  console.log('开始执行会员状态检查');
  
  try {
    const now = new Date();
    
    // 1. 处理时间卡（日卡和月卡）过期
    const expiredTimeCards = await db.collection('users')
      .where({
        memberStatus: 'active',
        membertype: dbCmd.in(['daily', 'monthly']),
        memberExpireTime: dbCmd.lte(now)
      })
      .get();

    let timeCardsUpdated = 0;
    if (expiredTimeCards.data.length > 0) {
      for (const user of expiredTimeCards.data) {
        await db.collection('users')
          .doc(user._id)
          .update({
            memberStatus: 'expired',
            membertype: 'none',
            remainingValue: 0
          });
        timeCardsUpdated++;
      }
    }

    // 2. 处理次卡用完的情况
    const expiredTimesCards = await db.collection('users')
      .where({
        memberStatus: 'active',
        membertype: 'times',
        remainingValue: dbCmd.lte(0)
      })
      .get();

    let timesCardsUpdated = 0;
    if (expiredTimesCards.data.length > 0) {
      for (const user of expiredTimesCards.data) {
        await db.collection('users')
          .doc(user._id)
          .update({
            memberStatus: 'expired',
            membertype: 'none',
            remainingValue: 0
          });
        timesCardsUpdated++;
      }
    }

    // 3. 统计并返回结果
    const totalUpdated = timeCardsUpdated + timesCardsUpdated;
    
    return {
      code: 0,
      message: '会员状态更新完成',
      data: {
        totalUpdated,
        timeCardsExpired: timeCardsUpdated,
        timesCardsExpired: timesCardsUpdated,
        updateTime: now
      }
    };

  } catch (error) {
    console.error('更新会员状态时发生错误:', error);
    return {
      code: 1,
      message: '更新失败',
      error: error.message
    };
  }
};