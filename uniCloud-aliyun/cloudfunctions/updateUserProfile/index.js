'use strict';


exports.main = async function (event, context) {
  try
   {

    const db = uniCloud.database();
    const { uid, username, email, bio, birthday, avatar } = event;
    
        // 检查是否提供 uid
        if (!uid) {
          return {
            code: -1,
            success: false,
            message: '用户 ID 未提供',
          };
        }
    // 构造需要更新的数据
    const updateData = {};
    if (username) updateData.nickname = username; // 将 `username` 映射到 `nickname`
    if (email) updateData.email = email;
    if (bio) updateData.bio = bio;
    if (birthday) updateData.birthday = birthday;
	if (avatar) updateData.avatarUrl = avatar;
    if (Object.keys(updateData).length === 0) {
      return {
        code: -1,
        success: false,
        message: '无有效数据可更新',
      };
    }

    // 更新数据库
    const updateResult = await db.collection('User').where({
		userId:uid
	}).update(updateData);

    if (updateResult.updated === 0) {
      return {
        code: -1,
        success: false,
        message: '更新失败，用户信息可能不存在',
      };
    }

    return {
      code: 0,
      success: true,
      message: '信息保存成功',
      data: updateData, // 返回更新后的数据
    };
  } catch (error) {
    console.error('信息保存失败:', error); // 打印错误日志
    return {
      code: -1,
      success: false,
      message: '信息保存失败，请稍后重试',
    };
  }
};
