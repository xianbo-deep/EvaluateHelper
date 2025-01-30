'use strict';
const db = uniCloud.database();
exports.main = async (event, context) => {
	//event为客户端上传的参数
	const{ uid } = event;
	 if (!uid) {
	    return {
	      code: 2,
	      message: '参数缺失，未提供 userId'
	    };
	  }
	try{
		const collection =db.collection('User');
		const res = await collection.where({ userId:uid }).get();
		if(res.data.length > 0){
			return{
				code:0,
				data:{
					avaterUrl: res.data[0].avaterUrl,
					nickname: res.data[0].nickname,
					email: res.data[0].email,
					bio: res.data[0].bio,
					birthday: res.data[0].birthday
				}
			};
		}else
		{
			return{
				code:1,
				message:"用户不存在"
			};
		}
	}catch(error){
		console.error('数据库查询错误',error);
		return{
			code:3,
			message:'数据库查询失败',
			error:error.message
		};
	}
};
