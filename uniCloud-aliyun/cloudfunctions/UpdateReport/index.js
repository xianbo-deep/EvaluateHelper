'use strict';
exports.main = async (event, context) => {
    const { userId, recordId, token, metrics } = event;
    
    // 参数验证
    if (!userId || !recordId) {
        return {
            code: 1,
            success: false,
            message: '用户ID和记录ID不能为空'
        };
    }
    
    if (!metrics || !Array.isArray(metrics)) {
        return {
            code: 1,
            success: false,
            message: '指标数据格式错误'
        };
    }
    
    const db = uniCloud.database();
    
    try {
        // 更新评测记录的 token
        await db.collection('AssessmentRecord')
            .where({
                userId,
                recordId
            })
            .update({
                totaltoken: token
            });
            
        // 直接使用前端传来的处理好的metrics数组
        await db.collection('MetricResult')
            .add({
                userId: userId,
                recordId: recordId,
                evaluationTime: Date.now(),
                metrics: metrics, // 直接使用，不再需要解析
            });
            
        return {
            code: 0,
            success: true,
            message: '更新成功'
        };
        
    } catch (error) {
        console.error('更新失败:', error);
        return {
            code: 2,
            success: false,
            message: error.message || '更新失败'
        };
    }
};