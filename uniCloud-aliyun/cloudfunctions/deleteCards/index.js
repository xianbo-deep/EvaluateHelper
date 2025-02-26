'use strict';
const db = uniCloud.database();
exports.main = async (event, context) => {
  try {
    const res = await db.collection('Card').where({}).remove();
    return {
      code: 0,
      msg: '清空成功',
      deletedCount: res.deleted
    };
  } catch (err) {
    return {
      code: 1,
      msg: '清空失败',
      error: err.message
    };
  }
};

