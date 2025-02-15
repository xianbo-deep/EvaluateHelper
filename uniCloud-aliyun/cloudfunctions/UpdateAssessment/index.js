'use strict';
exports.main = async (event, context) => {
    const { userId, recordId, timestamp } = event;
    
    // 参数校验
    if (!userId || !recordId) {
        return {
            success: false,
            message: '用户ID和记录ID不能为空'
        };
    }

    const db = uniCloud.database();
    try {
        // 更新评测时间
        const res = await db.collection('AssessmentRecord')
            .where({
                userId: userId,
                recordId: recordId
            })
            .update({
                assessmentTime: timestamp  // 如果没有传入时间戳，使用当前时间
            });

        // 检查更新结果
        if (res.updated === 1) {
            return {
                success: true,
                message: '评测时间更新成功'
            };
        } else {
            return {
                success: false,
                message: '未找到匹配的记录'
            };
        }

    } catch (error) {
        console.error('更新评测时间失败:', error);
        return {
            success: false,
            message: '更新失败',
            error: error.message
        };
    }
};