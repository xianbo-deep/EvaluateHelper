'use strict';
const Client = require('@alicloud/nls-filetrans-2018-08-17');
const config = require('./config.js');
// 云函数入口函数
exports.main = async (event, context) => {
    
    
        // 从解析后的对象中获取 fileLink
        const { fileLink } = event;
        
        console.log('解析后的 fileLink:', fileLink);
        
        if (!fileLink) {
            return {
                code: -1,
                file: fileLink || '无文件',
                msg: '未提供文件链接'
            }
        }
    
    // 地域ID，固定值
    const ENDPOINT = 'http://filetrans.cn-shanghai.aliyuncs.com';
    const API_VERSION = '2018-08-17';
    
    // 创建客户端实例
    const client = new Client({
        accessKeyId: config.ALIYUN_AK_ID,
        secretAccessKey:config.ALIYUN_AK_SECRET,
        endpoint: ENDPOINT,
        apiVersion: API_VERSION
    });
    
    try {
        // 构建任务参数
        const task = JSON.stringify({
            appkey: config.NLS_APP_KEY,
            file_link: fileLink,
            version: "4.0",
            enable_words: false,
			enable_sample_rate_adaptive: true
        });
        
        // 提交识别任务
        const submitResponse = await client.submitTask({
            Task: task
        }, { method: 'POST' });
        
        if (submitResponse.StatusText !== 'SUCCESS') {
            return {
                code: -1,
                msg: '录音文件识别请求响应失败',
                data: submitResponse
            };
        }
        
        // 获取任务ID
        const taskId = submitResponse.TaskId;
        
        // 轮询获取结果
        let result = null;
        let retryCount = 0;
        const MAX_RETRY = 100; // 最大重试次数，防止超时
        
        while (retryCount < MAX_RETRY) {
            const response = await client.getTaskResult({
                TaskId: taskId
            });
            
            const { StatusText } = response;
            
            if (StatusText === 'SUCCESS' || StatusText === 'SUCCESS_WITH_NO_VALID_FRAGMENT') {
                result = response.Result;
                break;
            } else if (StatusText === 'RUNNING' || StatusText === 'QUEUEING') {
                // 继续等待
                await new Promise(resolve => setTimeout(resolve, 10000));
                retryCount++;
                continue;
            } else {
                return {
                    code: -1,
                    msg: '录音文件识别失败',
                    data: response
                };
            }
        }
        
        if (!result && retryCount >= MAX_RETRY) {
            return {
                code: -1,
                msg: '识别超时',
                data: null
            };
        }
        
        return {
            code: 0,
            msg: '识别成功',
            data: result
        };
        
    } catch (error) {
        return {
            code: -1,
            msg: '识别失败',
            error: error.message
        };
    }
} 