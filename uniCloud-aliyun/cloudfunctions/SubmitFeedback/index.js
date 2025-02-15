'use strict';
exports.main = async (event, context) => {
	try {
		const db = uniCloud.database();
		const {userid,type,content,contact,timestamp} = event;
		// 获取Id
		let nextId = 1;
		const res = await db.collection('Feedback').orderBy('feedbackId',"desc").limit(1).get();
		if(res.data.length > 0){
			nextId = res.data[0].feedbackId + 1;
		}
		// 封装
		const data = {
			feedbackId:nextId,
			userId: userid,
			submitTime: timestamp,
			content: content,
			status: 'pending',
			processTime: '',
			adminId: '',
			contact:contact,
			feedbacktype:type
		}
		await db.collection('Feedback').add(data);
		return{
			success:true,
			message: '反馈提交成功'
		}
	}
	catch(error){
		return{
			success:false,
			message:'反馈提交失败，请重试'
		}
	  }
};
