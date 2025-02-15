'use strict';

exports.main = async (event, context) => {
  // 解构请求参数并校验
  const { fileUrl, userId, name, fileformat, timestamp, text} = event;
  if (!fileUrl || !userId || !name || !fileformat || !timestamp || !text) {
    return { success: false, message: '请求参数不完整' };
  }

  const db = uniCloud.database();

  try {
    // 1. 获取下一个 fileId
    let FileId = 1;
    const fileRes = await db.collection('FileStorage').orderBy('fileId', 'desc').limit(1).get();
    if (fileRes.data.length > 0) {
      FileId = fileRes.data[0].fileId + 1;
    }

    // 2. 插入文件数据
    const fileData = {
      fileId: FileId,
      userId: userId,
      fileFormat: fileformat,
      fileUrl: fileUrl,
      uploadTime: timestamp,
      name: name
    };

    const fileInsertRes = await db.collection('FileStorage').add(fileData);
    if (!fileInsertRes.id) {
      return { success: false, message: '文件数据插入失败' };
    }

    // 3. 获取下一个 recordId
    let AssId = 1;
    const assRes = await db.collection('AssessmentRecord').orderBy('recordId', 'desc').limit(1).get();
    if (assRes.data.length > 0) {
      AssId = assRes.data[0].recordId + 1;
    }

    // 4. 插入评估记录数据
    const AssData = {
      recordId: AssId,
      userId: userId,
      fileId: FileId,
      assessmentTime: '', // 默认当前时间
      totaltoken: 0, // 默认值
      name: name,
      score: null, // 评估分数，初始为 null
	  record:"",
	  text:text,
	  uploadUrl: fileUrl
    };

    const assInsertRes = await db.collection('AssessmentRecord').add(AssData);
    if (!assInsertRes.id) {
      return { success: false, message: '评估记录插入失败' };
    }

    return { data:{recordId:AssId},success: true, message: '数据已成功提交' };
  } catch (error) {
    console.error('提交失败:', error);
    return { success: false, message: '数据提交失败', error: error.message };
  }
};
