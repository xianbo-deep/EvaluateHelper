<template>
  <view class="container">
    <!-- 背景动画 -->
    <view class="background">
      <view class="gradient-orb"></view>
      <view class="gradient-orb"></view>
    </view>

    <view class="content">
      <!-- 加载动画区域 -->
      <view class="loading-area">
        <!-- 外圈动画 -->
        <view class="loading-ring"></view>
        <!-- 内圈动画 -->
        <view class="loading-core">
          <view class="pulse"></view>
        </view>
      </view>

      <!-- 文字提示区域 -->
      <view class="text-area">
        <text class="loading-title">正在生成评测报告</text>
        <view class="loading-dots">
          <text class="dot">.</text>
          <text class="dot">.</text>
          <text class="dot">.</text>
        </view>
        <text class="loading-tip">请稍候，马上为您呈现专属报告</text>
      </view>
    </view>
  </view>
</template>

<script>
import { store } from '/uni_modules/uni-id-pages/common/store.js';	
export default {
  data() {
    return {
      isLoading: true,
    };
  },
  onLoad() {
    this.toevaluatereport();
  },
  methods: {
async toevaluatereport() {
    try {
        const userId = store.userInfo._id;
        const recordId = uni.getStorageSync(`${userId}_recordId`);
        console.log('当前记录ID:', recordId);
        
        const result = await uniCloud.callFunction({
            name: 'UpdateAssessment',
            data: {
                userId,
                recordId,
                timestamp: Date.now()
            }
        });
                
        if (result.result.success) {
           
            
            const res = await uni.request({
                url: 'https://api.coze.cn/v1/workflow/run',
                method: 'POST',
                header:{
                    "Authorization": "Bearer pat_ivZIHe8q33jRGVaFig3ECRoeuI7y9acpqr5t3GcEqxL3H6KhMorM0HSio9Wmar4U",
                    "Content-Type": "application/json"
                },
                data:{
                    "workflow_id":"7468203893417459731",
                    "parameters": {
                        "input": result.result.data[0].text
                    }		
                }
            });
            if(res.data.msg === 'Success'){
                try {
					console.log('API反回的数据',res.data.data);
                    // 解析第一层JSON
                    const outerData = JSON.parse(res.data.data);
                    
                    // 获取内层数据，直接替换转义字符
                    const innerDataStr = outerData.data.replace(/\\\"/g, '"');
                    console.log('处理后的内层数据:', innerDataStr);
                    
                    const innerData = JSON.parse(innerDataStr);
                    
                    // 获取metrics数组
                    const metricsArray = innerData.metrics;
                    const totalscore = innerData.totalscore.score;
                    if (!metricsArray || !Array.isArray(metricsArray) || metricsArray.length === 0) {
                        throw new Error('未找到有效的metrics数组');
                    }
                    
                    console.log(`成功提取到${metricsArray.length}个评估指标`);
                    
                    // 存储数据到本地
                    uni.setStorageSync(`${userId}_metrics`, metricsArray);
                    uni.setStorageSync(`${userId}_score`, totalscore);
                   
                    // 调用云函数更新报告
                    const ans = await uniCloud.callFunction({
                        name: 'UpdateReport',
                        data:{
                            userId,
                            recordId,
                            token: res.data.token,
                            metrics: metricsArray
                        }
                    });
                    
                    if(ans.result.code === 0){
                        console.log('报告更新成功');
                        uni.navigateTo({
                            url: '/pages/Report/Report'
                        });
                    } else {
                        throw new Error('更新报告失败: ' + (ans.result.message || '未知错误'));
                    }
                    
                } catch (parseError) {
                    console.error('数据解析错误:', parseError);
                    console.error('原始数据:', res.data.data);
                    throw new Error('评分数据解析失败，请重试');
                }
            } else {
                throw new Error('API调用失败: ' + res.data.msg);
            }
        } else {
            throw new Error('评测更新失败');
        }
    } catch (error) {
        console.error('评测报告处理出错:', error);
        uni.showToast({
            title: error.message || '发生错误',
            icon: 'none',
            duration: 2000
        });
    } 
}
	
  },
};
</script>

<style>
.container {
  min-height: 100vh;
  background: #F8FAFC;
  position: relative;
  overflow: hidden;
}

/* 背景效果 */
.background {
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 1;
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60rpx);
}

.gradient-orb:nth-child(1) {
  width: 600rpx;
  height: 600rpx;
  background: linear-gradient(135deg, rgba(91, 33, 182, 0.1), rgba(67, 56, 202, 0.05));
  top: -200rpx;
  right: -100rpx;
  animation: float 20s infinite alternate;
}

.gradient-orb:nth-child(2) {
  width: 500rpx;
  height: 500rpx;
  background: linear-gradient(225deg, rgba(99, 102, 241, 0.08), rgba(79, 70, 229, 0.05));
  bottom: -150rpx;
  left: -100rpx;
  animation: float 15s infinite alternate-reverse;
}

/* 主要内容 */
.content {
  position: relative;
  z-index: 2;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40rpx;
}

/* 加载动画区域 */
.loading-area {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  margin-bottom: 60rpx;
}

.loading-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 6rpx solid transparent;
  border-top: 6rpx solid rgba(139, 92, 246, 0.8);
  border-right: 6rpx solid rgba(99, 102, 241, 0.6);
  animation: spin 2s linear infinite;
}

.loading-core {
  position: absolute;
  width: 70%;
  height: 70%;
  top: 15%;
  left: 15%;
  background: linear-gradient(135deg, #8B5CF6, #6366F1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pulse {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #8B5CF6, #6366F1);
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

/* 文字区域 */
.text-area {
  text-align: center;
}

.loading-title {
  font-size: 36rpx;
  color: #1E293B;
  font-weight: 600;
  margin-bottom: 20rpx;
  display: block;
}

.loading-dots {
  height: 40rpx;
  margin-bottom: 20rpx;
}

.dot {
  display: inline-block;
  color: #1E293B;
  font-size: 40rpx;
  animation: dots 1.4s infinite;
  opacity: 0;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
}

.loading-tip {
  font-size: 28rpx;
  color: rgba(30, 41, 59, 0.7);
  display: block;
}

/* 动画效果 */
@keyframes float {
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(30rpx, -30rpx);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(0.8);
    opacity: 0.8;
  }
  50% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes dots {
  0%, 20% {
    opacity: 0;
    transform: translateY(0);
  }
  50% {
    opacity: 1;
    transform: translateY(-10rpx);
  }
  80%, 100% {
    opacity: 0;
    transform: translateY(0);
  }
}
</style>