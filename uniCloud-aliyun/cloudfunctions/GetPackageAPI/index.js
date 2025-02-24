'use strict';
exports.main = async (event, context) => {
    const { userId } = event;
    const db = uniCloud.database();
    
    try {
        // 1. 查询用户选择的套餐ID
        const selectResult = await db.collection('Select')
            .where({
                userId: userId
            })
            .field({
                packageId: true,
                _id: false
            })
            .get();

        if (!selectResult.data || !selectResult.data[0]) {
            return {
                success: false,
                code: -2,
                message: '未找到用户所选套餐'
            };
        }

        // 2. 获取套餐对应的AgentId
        const packageResult = await db.collection('Package')
            .where({
                package_id: Number(selectResult.data[0].packageId) 
            })
            .field({
                AgentId: true,
                _id: false
            })
            .get();

        if (!packageResult.data || !packageResult.data[0]) {
            return {
                success: false,
                code: -3,
                message: '未找到套餐对应的Agent'
            };
        }

        // 3. 查询Agent信息
        const agentResult = await db.collection('Agent')
            .where({
                agentId: Number(packageResult.data[0].AgentId),
                status: 'active'
            })
            .field({
                agentId: true,
                apiPath: true,
                description: true,
                workflowId: true,
                authorization: true,
				method: true,
                _id: false
            })
            .get();

        if (!agentResult.data || !agentResult.data[0]) {
            return {
                success: false,
                code: -4,
                message: '未找到Agent信息或Agent已禁用'
            };
        }

        return {
            success: true,
            code: 0,
            data: agentResult.data[0]  // 直接返回单个Agent的信息
        };

    } catch (error) {
        console.error('获取API配置失败:', error);
        return {
            success: false,
            code: -1,
            message: error.message || '获取API配置失败'
        };
    }
};