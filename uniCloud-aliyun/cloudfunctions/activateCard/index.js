'use strict';
const db = uniCloud.database();
const dbCmd = db.command;

exports.main = async (event, context) => {
  const { cardNumber, cardPassword, userId } = event;
  if (!cardNumber || !cardPassword || !userId) {
    return {
      code: -1,
      message: '缺少必要参数'
    };
  }
  
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
      
    if (!userInfo.data || userInfo.data.length === 0) {
      return {
        code: -1,
        message: '用户不存在'
      };
    }

    const user = userInfo.data[0];
    const now = new Date();
    let expireTime;
    let remainingTimes;
    let remainingDays;

    // 检查会员是否过期
    const isExpired = !user.memberExpireTime || new Date(user.memberExpireTime) < now;
    const hasRemainingTimes = user.membertype === 'times' && (user.remainingTimes || 0) > 0;

    // 判断卡类型兼容性
    if (!isExpired) { // 只在会员未过期时检查
      if (card.cardType === 'times' && ['monthly', 'daily'].includes(user.membertype)) {
        return {
          code: -1,
          message: '您当前是时长卡会员，不能购买次卡'
        };
      }
      
      if (['monthly', 'daily'].includes(card.cardType) && user.membertype === 'times' && hasRemainingTimes) {
        return {
          code: -1,
          message: '您当前是次卡会员且还有剩余次数，不能购买时长卡'
        };
      }
    }

    // 计算会员权益
    if (card.cardType === 'times') {
      // 次卡：累加次数
      remainingTimes = (user.remainingTimes || 0) + card.value;
    } else {
      // 日卡/月卡：计算到期时间
      if (user.memberStatus === 'active' && 
          ['daily', 'monthly'].includes(user.membertype) && 
          !isExpired) {
        // 如果是未过期的活跃会员，从当前到期时间开始累加
        expireTime = new Date(user.memberExpireTime);
      } else {
        // 已过期或非活跃会员从当前时间开始计算
        expireTime = new Date(now);
      }
      
      // 计算到期时间
      if (card.cardType === 'daily') {
        expireTime.setDate(expireTime.getDate() + card.value);
      } else if (card.cardType === 'monthly') {
        const daysInMonth = card.value * 30;
        expireTime.setDate(expireTime.getDate() + daysInMonth);
      }
      
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
              memberStartTime: user.memberStatus === 'active' && !isExpired ? 
                user.memberStartTime : now,
              memberExpireTime: expireTime,
              remainingDays: remainingDays
            }
        )
      });

    // 6. 添加兑换记录
    await db.collection('ExchangeRecord')
      .add({
        userId: userId,
        cardId: cardNumber,
        cardCode: cardPassword,
        redeemTime: Date.now(),
        cardType: card.cardType,
        cardValue: card.value
      });

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