'use strict';
const db = uniCloud.database();
const dbCmd = db.command;
exports.main = async (event, context) => {
  console.log('开始执行会员状态检查');
  
  try {
    const timeConfig = await db.collection('TimeConfig')
      .where({
        functionName: 'updateMemberStatus'  
      })
      .get();
      
    // 如果未启用，直接返回
    if (!timeConfig.data[0]?.enabled) {
      return {
        code: 0,
        message: '定时任务未启用',
        data: {
          enabled: false,
          updateTime: new Date()
        }
      };
    }
    
    const now = new Date();
    
    // 1. 处理时间卡（日卡和月卡）过期，并更新剩余天数
    const timeCardUsers = await db.collection('User')
      .where({
        memberStatus: 'active',
        membertype: dbCmd.in(['daily', 'monthly'])
      })
      .get();
    
    let timeCardsUpdated = 0;
    
    if (timeCardUsers.data.length > 0) {
      for (const user of timeCardUsers.data) {
        const expireTime = new Date(user.memberExpireTime).getTime();
        const currentTime = now.getTime();
        const remainingDays = Math.ceil((expireTime - currentTime) / (1000 * 60 * 60 * 24));
        const newRemainingDays = Math.max(0, remainingDays); // 防止负数
        
        let updateData = { remainingDays: newRemainingDays };
        
        // 如果已过期，则修改状态
        if (newRemainingDays === 0) {
          updateData.memberStatus = 'expired';
          updateData.membertype = 'none';
          updateData.cardCategory = 'none'; // 重置卡片类别为none
        }
        
        await db.collection('User')
          .doc(user._id)
          .update(updateData);
          
        timeCardsUpdated++;
      }
    }
    
    // 2. 处理次卡用完的情况，包括免费试用的次卡
    const expiredTimesCards = await db.collection('User')
      .where({
        memberStatus: 'active',
        membertype: 'times',
        remainingTimes: dbCmd.lte(0)
      })
      .get();
    
    let timesCardsUpdated = 0;
    
    if (expiredTimesCards.data.length > 0) {
      for (const user of expiredTimesCards.data) {
        await db.collection('User')
          .doc(user._id)
          .update({
            memberStatus: 'expired',
            membertype: 'none',
            cardCategory: 'none',
            remainingTimes: 0
          });
          
        timesCardsUpdated++;
      }
    }
    
    // 3. 处理已过期的次卡（包括免费试用）
    const expiredByDate = await db.collection('User')
      .where({
        memberStatus: 'active',
        membertype: 'times',
        memberExpireTime: dbCmd.lt(now)
      })
      .get();
    
    let expiredByDateCount = 0;
    
    if (expiredByDate.data.length > 0) {
      for (const user of expiredByDate.data) {
        await db.collection('User')
          .doc(user._id)
          .update({
            memberStatus: 'expired',
            membertype: 'none',
            cardCategory: 'none',
            remainingTimes: 0
          });
          
        expiredByDateCount++;
      }
    }
    
    // 4. 统计并返回结果
    const totalUpdated = timeCardsUpdated + timesCardsUpdated + expiredByDateCount;
    
    // 5. 更新TimeConfig表的执行时间
    await db.collection('TimeConfig')
      .where({
        functionName: 'updateMemberStatus'
      })
      .update({
        updateTime: now.getTime()
      });
    
    return {
      code: 0,
      message: '会员状态更新完成',
      data: {
        totalUpdated,
        timeCardsUpdated,
        timesCardsUpdated,
        expiredByDateCount,
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