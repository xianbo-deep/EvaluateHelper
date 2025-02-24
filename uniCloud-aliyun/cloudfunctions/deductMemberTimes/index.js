'use strict';
const db = uniCloud.database();
exports.main = async (event, context) => {
    const { userId } = event;
    
    try {
        const userCollection = db.collection('User');
        
        // 获取用户最新信息
        const userResult = await userCollection
            .where({ userId: userId })
            .get();
            
        if (!userResult.data || userResult.data.length === 0) {
            return {
                code: 1,
                message: '用户不存在'
            };
        }
        
        const user = userResult.data[0];
        if (user.membertype === 'monthly' || user.membertype === 'daily') {
                    return {
                        code: 0,
                        message: '会员无限制使用',
                        remainingTimes: 'unlimited'
                    };
                }
        // 验证会员类型和剩余次数
        if (user.membertype !== 'times' || user.remainingTimes <= 0) {
            return {
                code: 2,
                message: '无可用次数'
            };
        }
        
        // 扣减次数
        const newRemainingTimes = user.remainingTimes - 1;
        const updateData = {
            remainingTimes: newRemainingTimes
        };
        
        // 如果次数归零，更新会员类型
        if (newRemainingTimes === 0) {
            updateData.membertype = 'none'; // 变更为免费用户
			updateData.memberStatus = 'none';        
			}
        
        const updateResult = await userCollection
            .where({ userId: userId })
            .update(updateData);
            
        if (updateResult.updated === 1) {
            return {
                code: 0,
                message: newRemainingTimes === 0 ? '次数已用完' : '扣减成功',
                remainingTimes: newRemainingTimes,
                isZero: newRemainingTimes === 0
            };
        } else {
            return {
                code: 3,
                message: '扣减失败'
            };
        }
    } catch (error) {
        console.error(error);
        return {
            code: 4,
            message: '系统错误'
        };
    }
};