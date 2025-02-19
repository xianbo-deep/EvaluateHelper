'use strict';
const db = uniCloud.database();
const dbCmd = db.command;
exports.main = async (event, context) => {
  const { cardNumber, cardPassword, userId } = event;
  
  try {
    // 1. 查找卡密
    const cardResult = await db.collection('Card')
      .where({
        cardId: cardNumber,
        cardCode: cardPassword
      })
      .get();
      
    if (!cardResult.data || cardResult.data.length === 0) {
      return {
        code: 1,
        message: '无效的卡密'
      };
    }
    
    const card = cardResult.data[0];
    
    // 2. 验证卡密状态
    if (card.status === 'invalid') {
      return {
        code: 2,
        message: '该卡密已失效'
      };
    }
    
    if (card.status === 'used') {
      return {
        code: 3,
        message: '该卡密已被使用'
      };
    }
    
    // 3. 获取用户当前会员信息
    const userInfo = await db.collection('User')
      .where({userId: userId})
      .get();
      
    const now = Date.now();
    let expireTime;
    let remainingTimes;
    let remainingDays;
    
    if (card.cardType === 'times') {
      // 次卡：累加次数
      remainingTimes = (userInfo.data[0].remainingTimes || 0) + card.value;
    } else {
      // 日卡/月卡：计算到期时间
      if (userInfo.data[0].memberStatus === 'active' && 
          ['daily', 'monthly'].includes(userInfo.data[0].membertype)) {
        // 如果已是活跃的日卡或月卡会员，从当前到期时间开始累加
        expireTime = new Date(userInfo.data[0].memberExpireTime);
      } else {
        // 否则从当前时间开始计算
        expireTime = new Date(now);
      }
      
      // 计算到期时间
      if (card.cardType === 'daily') {
        expireTime.setDate(expireTime.getDate() + card.value);
      } else if (card.cardType === 'monthly') {
        // 将月卡转换为天数（按30天/月计算）
        const daysInMonth = card.value * 30;
        expireTime.setDate(expireTime.getDate() + daysInMonth);
      }
      
      // 计算剩余天数
      remainingDays = Math.ceil((expireTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }
    
    // 4. 更新卡密状态
    await db.collection('Card')
      .where({
        cardId: cardNumber,
        cardCode: cardPassword
      })
      .update({
        status: 'used',
        useTime: now,
        usedBy: userId
      });
    
    // 5. 更新用户会员信息
    await db.collection('User')
      .where({userId: userId})
      .update({
        memberStatus: 'active',
        membertype: card.cardType,
        ...(card.cardType === 'times' 
          ? { remainingTimes }
          : { 
              memberStartTime: userInfo.data[0].memberStatus === 'active' ? 
                userInfo.data[0].memberStartTime : now,
              memberExpireTime: expireTime,
              remainingDays: remainingDays
            }
        )
      });
    await db.collection('ExchangeRecord')
	.add({
		userId: userId,
		cardId: cardNumber,
		cardCode: cardPassword,
		redeemTime: Date.now(),
		cardType: card.cardType,
		cardValue: card.value
	})
    return {
      code: 0,
      message: '兑换成功',
      data: {
        membertype: card.cardType,
        value: card.value,
        ...(card.cardType === 'times' 
          ? { remainingTimes }
          : { 
              expireTime,
              remainingDays 
            }
        )
      }
    };
    
  } catch (error) {
    console.error('兑换卡密失败:', error);
    return {
      code: -1,
      message: '兑换失败',
      error: error.message
    };
  }
};