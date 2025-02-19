'use strict';
exports.main = async (event, context) => {
	const{ userId } = event;
	const db = uniCloud.database();
	try{
		const res = await db.collection('User')
		.where({userId: userId})
		.update({
			memberStatus: "active",
			membertype: "times",
			usedTrial: true,
			remainingTimes: 1
		})
		return {
			success: true,
			code: 0
		}
	}catch(error){
		return{
			success: false,
			code: 1,
			err: "激活出现问题"
		}
	}
	
	//返回数据给客户端
	return event
};
