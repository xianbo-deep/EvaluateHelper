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
        // 先检查记录是否存在
        const checkRecord = await db.collection('AssessmentRecord')
            .where({
                userId: userId,
                recordId: recordId
            })
            .get();
            
        if (checkRecord.data.length === 0) {
            return {
                success: false,
                message: '未找到匹配的记录'
            };
        }

        // 更新评测时间
        const res = await db.collection('AssessmentRecord')
            .where({
                userId: userId,
                recordId: recordId
            })
            .update({
                assessmentTime: timestamp   // 移除了多余的 data 包装
            });

        // 如果更新成功，再获取文本内容
        if (res.updated === 1) {
            const textResult = await db.collection('AssessmentRecord')
                .where({
                    userId: userId,
                    recordId: recordId
                })
                .field({
                    text: true
                })
                .get();
                
            if (textResult.data && textResult.data.length > 0) {
                return {
                    success: true,
                    message: '评测时间更新成功',
                    data: textResult.data
                };
            } else {
                return {
                    success: false,
                    message: '获取文本内容失败'
                };
            }
        } else {
            return {
                success: false,
                message: '更新记录失败'
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