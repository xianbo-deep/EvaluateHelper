'use strict';
exports.main = async (event, context) => {
    const db = uniCloud.database();
    let { recordId, userId } = event;
    recordId = parseInt(recordId);
    try {
        // 获取评估记录
        const res = await db.collection('AssessmentRecord')
            .where({
                userId: userId,
                recordId: recordId 
            })
            .get();
            
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
            
        const record = res.data[0];
        
        // 直接返回 metrics 数组作为一个对象的属性
        return {
            success: true,
            data: {
                assessmentTime: record.assessmentTime,
                totaltoken: record.totaltoken,
                score: record.score,
                duration: record.duration,
                record: record.record,
                metrics: [{
                    metrics: metricsRes.data[0]?.metrics || [] // 获取第一条记录的 metrics 字段
                }]
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