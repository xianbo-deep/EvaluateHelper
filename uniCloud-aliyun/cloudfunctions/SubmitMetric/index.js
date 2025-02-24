'use strict';
exports.main = async (event, context) => {
  const db = uniCloud.database();
  try {
    // 解构数据
    const { userId, packageName, timestamp ,packageId} = event;
    
    // 参数校验
    if (!userId || !packageName || !timestamp) {
      return {
        success: false,
        message: '参数不完整',
      };
    }

    // 检查是否存在记录
    const userRes = await db.collection('Select').where({
      userId: userId,
    }).get();

    if (userRes.data.length > 0) {
      // 更新已有记录
      const updateRes = await db.collection('Select').where({
        userId: userId,
		packageId: packageId
      }).update({
        packageName: packageName,
        timestamp: timestamp,
      });

      // 不管是否实际更新了数据，只要执行成功就返回成功
      return {
        success: true,
        message: updateRes.updated > 0 ? '更新成功' : '数据已保存',
      };
    } else {
      // 新增记录
      // 获取新的selectId
      let nextId = 1;
      const res = await db.collection('Select').orderBy('selectId', "desc").limit(1).get();
      if (res.data.length > 0) {
        nextId = res.data[0].selectId + 1;
      }

      // 构建新记录
      const data = {
        selectId: nextId,
        fileId: '',
        userId: userId,
        packageName: packageName,
        timestamp: timestamp,
		packageId: packageId
      };

      // 执行新增
      await db.collection('Select').add(data);
      return {
        success: true,
        message: '保存成功',
      };
    }
  } catch (error) {
    console.error('操作失败：', error);
    return {
      success: false,
      message: '系统错误，请稍后重试',
    };
  }
};