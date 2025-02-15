'use strict';
exports.main = async (event, context) => {
	const{ userId, recordId, assessmentTime, score, record, totaltoken, metrics} = event;
	const db = uniCloud.database();
	try{
		const ans = await db.collection('MetricResult')
		.where({
			userId :userId,
			recordId: recordId
			})
		.update({
			metrics: metrics
		})
		const res = await db.collection('AssessmentRecord')
		.where({
			userId :userId,
			recordId: recordId
			})
		.update({
			score: score,
			assessmentTime: assessmentTime,
			record: record,
			totaltoken: totaltoken
		})
		return{
			success: true,
			message: "更新成功"
		}
	}catch(error){
		return{
			success: false,
			message: "更新失败"
		}
	}
	
};
