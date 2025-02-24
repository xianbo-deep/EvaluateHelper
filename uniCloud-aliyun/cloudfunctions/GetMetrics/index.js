'use strict';
exports.main = async (event, context) => {
    const db = uniCloud.database();
    try {
        // 从Metric表中获取所有指标
        const res = await db.collection('Package')
            .field({  // 只获取需要的字段
                'package_name': true,  // 假设数据库中是metricId
                'description': true ,// 假设数据库中是metricname
				'package_id': true,
				'status':true
            })
            .get();

        // 转换数据格式以匹配前端需求
        const formattedData = res.data.map(item => ({
			package_id: item.package_id,
            package_name: item.package_name,         // 转换字段名以匹配前端
            description: item.description,
			status:item.status
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
