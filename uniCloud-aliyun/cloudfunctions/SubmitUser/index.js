'use strict';

exports.main = async (event, context) => {
  const db = uniCloud.database();  // 使用 uniCloud 数据库
  const collection = db.collection('User');  // 假设你的集合名是 'User'
  const {phone,password} = event;
  console.log('查询条件:', {phone, password});
  try {
    // 查找手机号和密码是否匹配，并且它们在同一条记录里
    const res = await collection.where({
      phone: phone,  // 根据手机号查询
      password: password  // 根据密码查询
    }).get();

    // 如果查询到数据
    if (res.data.length > 0 && res.data[0].status == 'active') {
      // 获取当前时间的 UTC 时间戳
      const utcTimestamp = new Date().getTime();

      // 北京时间 = UTC时间 + 8小时（8 * 60 * 60 * 1000 毫秒）
      const beijingTimestamp = utcTimestamp + (8 * 60 * 60 * 1000);

      // 用户登录成功，更新 lastLoginTime 为北京时间时间戳
      await collection.where({ phone: phone }).update({
        lastLoginTime: beijingTimestamp  // 使用北京时间时间戳
      });

      // 返回登录成功的响应
      return {
        code: 0,  // 0表示成功
        message: '登录成功',
        data: res.data[0]  // 返回用户的资料
      };
	else if(res.data[0].status == 'inactive')
	{
		code: 1,
		message:'您已被禁止登录'
	}
    } else {
      // 如果没有找到符合条件的记录
      return {
        code: 2,  // 1表示失败
        message: '手机号或密码错误'
      };
    }
  } catch (e) {
    // 捕获异常并返回
    console.error(e);
    return {
      code: 2,  // 2表示系统错误
      message: '系统异常'
    };
  }
};
