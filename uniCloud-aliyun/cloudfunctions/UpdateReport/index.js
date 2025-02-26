'use strict';
exports.main = async (event, context) => {
    const { userId, recordId, token, metrics, record, score, duration } = event;
    
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
                totaltoken: token,
                record: record,
                score: score,
                duration: duration
            });
            
        // 修改这里的代码 - 安全地获取nextId
        let nextId = 1;
        const res = await db.collection('MetricResult').orderBy('resultId', "desc").limit(1).get();
        
        // 增加详细的日志输出
        console.log("查询结果:", JSON.stringify(res.data));
        
        if (res.data && res.data.length > 0) {
            const latestRecord = res.data[0];
            // 检查resultId是否为有效数字
            if (latestRecord.resultId !== null && 
                latestRecord.resultId !== undefined && 
                !isNaN(Number(latestRecord.resultId))) {
                
                nextId = Number(latestRecord.resultId) + 1;
            } else {
                console.log("警告: 最新记录的resultId无效:", latestRecord.resultId);
            }
        }
        
        console.log("使用的nextId:", nextId);
        
        // 直接使用前端传来的处理好的metrics数组
        await db.collection('MetricResult')
            .add({
                userId: userId,
                recordId: recordId,
                evaluationTime: Date.now(),
                metrics: metrics, // 直接使用，不再需要解析
                resultId: nextId
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