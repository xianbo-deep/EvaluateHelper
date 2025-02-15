'use strict';
exports.main = async (event, context) => {
    const db = uniCloud.database();
    const { recordId, userId } = event;
    
    try {
        // 获取评估记录
        const res = await db.collection('AssessmentRecord')
            .where({
                userId: userId,
                recordId: recordId 
            })
            .get();
            
        // 检查是否找到记录
        if (!res.data || res.data.length === 0) {
            return {
                success: false,
                message: "未找到相关记录"
            };
        }
        
        // 获取指标结果
        const metricsRes = await db.collection('MetricResult')
            .where({
                recordId: recordId
            })
			.field({
				metrics: true
			})
            .get();
            
        // 从返回的数组中获取第一条记录
        const record = res.data[0];
        const metrics = metricsRes.data || [];
        
        return {
            success: true,
            data: {
                assessmentTime: record.assessmentTime,
                totaltoken: record.totaltoken,
                score: record.score,
                duration: record.duration,
                record: record.record,
                metrics: metrics
            }
        };
        
    } catch (error) {
        console.error('获取记录失败:', error);
        return {
            success: false,
            message: "获取信息发生错误"
        };
    }
};