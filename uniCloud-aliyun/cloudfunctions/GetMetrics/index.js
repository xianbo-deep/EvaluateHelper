'use strict';
exports.main = async (event, context) => {
    const db = uniCloud.database();
    try {
        // 从Metric表中获取所有指标
        const res = await db.collection('Metric')
            .field({  // 只获取需要的字段
                'metricId': true,  // 假设数据库中是metricId
                'metricname': true, // 假设数据库中是metricname
                'description': true
            })
            .get();

        // 转换数据格式以匹配前端需求
        const formattedData = res.data.map(item => ({
            id: item.metricId,     // 转换字段名以匹配前端
            name: item.metricname,
            description: item.description
        }));

        return {
            success: true,
            data: formattedData,
            message: '获取指标成功'
        };
    } catch (error) {
        console.error('获取指标失败:', error);
        return {
            success: false,
            message: '获取指标失败',
            error: error.message
        };
    }
};
