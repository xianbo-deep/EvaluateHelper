// checkMemberStatus/index.js
'use strict';
const db = uniCloud.database();

exports.main = async (event, context) => {
  try {
    console.log('开始检查会员状态:', new Date().toISOString());
    
    // 获取所有活跃会员
    const activeMembers = await db.collection('User')
      .where({
        memberStatus: 'active',
        membertype: db.command.in(['daily', 'monthly'])  // 只检查日卡和月卡会员
      })
      .get();
      
    const now = new Date().getTime();
    const updatePromises = [];
    
    // 检查每个会员的到期时间
    activeMembers.data.forEach(member => {
      if (member.memberExpireTime && new Date(member.memberExpireTime).getTime() < now) {
        // 会员已过期，更新状态
        updatePromises.push(
          db.collection('User')
            .where({
              userId: member.userId
            })
            .update({
              memberStatus: 'expired',
              membertype: 'none',
              memberExpireTime: null,
              remainingDays: 0
            })
        );
      }
    });
    
    // 执行所有更新
    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
      console.log(`已更新 ${updatePromises.length} 个过期会员状态`);
    }
    
    return {
      success: true,
      message: '会员状态检查完成',
      updatedCount: updatePromises.length
    };
    
  } catch (error) {
    console.error('检查会员状态失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};