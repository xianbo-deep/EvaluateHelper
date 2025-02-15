'use strict';
exports.main = async (event, context) => {
  const { userId } = event;
  if (!userId) {
    return { success: false, message: '用户ID不能为空' };
  }

  const db = uniCloud.database();
  try {
    // 1. 查询测评记录（AssessmentRecord）
    const res = await db.collection('AssessmentRecord')
      .where({ userId,
        score: db.command.neq(null) })
      .orderBy('assessmentTime', 'desc')
      .get();

    console.log('测评记录查询结果:', res.data);

    if (res.data.length === 0) {
      return { success: true, data: [] };
    }

    const records = res.data;
    const recordIds = records.map(record => record.recordId);

    console.log('记录ID列表:', recordIds);

    // 2. 查询指标结果（MetricResult）
    let metricsData = [];
    if (recordIds.length > 0) {
      const metricsRes = await db.collection('MetricResult')
        .where({
          recordId: db.command.in(recordIds)
        })
        .get();

      console.log('指标查询结果:', metricsRes.data);
      metricsData = metricsRes.data || [];
    }

    // 3. 合并数据
    const mergedData = records.map(record => {
      // 找到对应的 MetricResult 记录
      const metricRecord = metricsData.find(m => m.recordId === record.recordId);
      
      // 从 MetricResult 中提取 metrics 数组
      const metrics = metricRecord?.metrics?.map(metric => ({
        name: metric.metricname,
        score: metric.score
      })) || [];

      return {
        recordId: record.recordId,
        userId: record.userId,
        assessmentTime: record.assessmentTime,
        score: record.score ?? '未评分',
        duration: record.duration || '未知',
        dimensions: metrics
      };
    });

    return { success: true, data: mergedData };
  } catch (error) {
    console.error('查询失败:', error);
    return {
      success: false,
      message: '查询失败',
      error: error.message
    };
  }
};