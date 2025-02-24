'use strict';
exports.main = async (event, context) => {
  const { userId } = event;
  const db = uniCloud.database();
  
  try {
    const result = await db.collection('ExchangeRecord')
      .where({
        userId: userId
      })
      .orderBy('redeemTime', 'desc')  // 按兑换时间倒序排序
      .get();
    
    return {
      code: 0,
      message: '获取成功',
      data: result.data
    };
    
  } catch (error) {
    console.error('获取兑换记录失败:', error);
    return {
      code: 1,
      message: '获取记录失败'
    };
  }
};