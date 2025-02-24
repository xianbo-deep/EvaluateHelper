'use strict';
exports.main = async (event, context) => {
	const db = uniCloud.database();
	const{ userId ,recordId ,score} = event;
	try{
		await db.collection('AssessmentRecord')
		.where({
			userId: userId,
			recordId: recordId
		})
		.update({
			score: score
		})
		return {
			success: true,
			code: 0
		}
	}catch(error){
		return{
			success: false,
			code: -1
		}
	}
};
