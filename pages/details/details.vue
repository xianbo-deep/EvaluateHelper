<template>
  <view class="container">
    <view class="background">
      <view class="gradient-orb"></view>
      <view class="gradient-orb"></view>
    </view>
    
    <view v-if="loading" class="loading">
      <uni-load-more status="loading" />
    </view>
    
    <view v-else-if="error" class="error">
      <text>{{errorMessage}}</text>
      <button @tap="retryLoading" class="retry-btn">重试</button>
    </view>
    
    <view v-else class="content">
      <!-- 总分区域 -->
      <view class="score-section">
        <view class="total-score">
          <view class="score-circle-wrapper">
            <view class="score-circle-outer">
              <view class="score-circle-inner">
                <view class="score-content">
                  <view class="score-number">{{reportData.score || 0}}</view>
                  <view class="score-label">总分</view>
                </view>
              </view>
            </view>
          </view>
        </view>
		<view class="subject-name-container">
		  <view class="subject-label">评测对象</view>
		  <view class="subject-name">{{name}}</view>
		</view>
        <view class="score-info">
          <view class="score-date">评测时间：{{formatDate(reportData.assessmentTime)}}</view>
          <view class="duration">用时：{{reportData.duration}}分钟</view>
        </view>
      </view>
		<view class="video-details" @tap="gotovideodetails">
			视频详情
		</view>
      <!-- 分项指标评分 -->
      <view class="metrics-section">
        <view class="section-title">能力指标</view>
        <view class="metrics-grid">
          <view 
            class="metric-card" 
            v-for="metric in reportData.metrics[0].metrics" 
            :key="metric.metricId"
          >
            <view class="metric-header">
              <text class="metric-name">{{metric.metricname}}</text>
              <text class="metric-score">{{metric.score}}</text>
            </view>
            <view class="metric-bar-bg">
              <view 
                class="metric-bar" 
                :style="{ 
                  width: metric.score + '%', 
                  backgroundColor: getScoreColor(metric.score) 
                }"
              ></view>
            </view>
          </view>
        </view>
      </view>

      <!-- 详细评价建议 -->
      <view class="evaluation-section" v-if="reportData.metrics">
        <view class="section-title">详细评价</view>
        <view class="evaluation-cards">
          <view 
            class="evaluation-card" 
            v-for="detail in reportData.metrics[0].metrics" 
            :key="detail.metricId"
          >
            <view class="evaluation-header">
              <view class="evaluation-aspect">{{detail.metricname}}</view>
              <view class="evaluation-tag" :class="detail.description.level">
                {{detail.description.level}}
              </view>
            </view>
            <view class="evaluation-content">
              <text class="evaluation-text">{{detail.description.evaluation}}</text>
              <view class="suggestion-box">
                <view class="suggestion-title">提升建议</view>
                <text class="suggestion-text">{{detail.description.suggestion}}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 总体评价 -->
      <view class="summary-section" v-if="reportData.summary">
        <view class="section-title">总体评价</view>
        <view class="summary-card">
          <text class="summary-text">{{reportData.summary}}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { store } from '/uni_modules/uni-id-pages/common/store.js';

export default {
  data() {
    return {
	  recordId:'',
      loading: true,
      error: false,
      errorMessage: '',
	  name:'',
      reportData: {
        score: 0,
        assessmentTime: '',
        duration: 0,
        metrics: [],
        summary: ''
      }
    };
  },

  onLoad(option) {
    if (!option.recordId) {
      this.handleError('记录ID不存在');
      return;
    }
	this.recordId = option.recordId;
    this.fetchReportData(option.recordId);
  },

  methods: {
    async fetchReportData(recordId) {
      this.loading = true;
      this.error = false;
      
      try {
        if (!store.hasLogin) {
          throw new Error('请先登录');
        }
		const { result } = await uniCloud.database().collection('AssessmentRecord')
        .where({recordId:Number(recordId)})
        .field('name')
        .get()
        this.name = result.data[0].name; // 确保正确获取name字段
        const userId = store.userInfo._id;
		console.log(userId)
        const res = await uniCloud.callFunction({
          name: 'Getdetails',
          data: { userId, recordId }
        });
		
		 console.log('完整响应:', res);           // 打印完整响应
		    console.log('result:', res.result);      // 打印 result 对象
		    console.log('data:', res.result.data);   // 打印 data
		
        if (!res.result.success) {
          throw new Error(res.result.message || '获取数据失败');
        }
		
        this.reportData = this.formatReportData(res.result.data);
		console.log(this.reportData.metrics)
      } catch (error) {
        console.error('获取报告详情失败:', error);
        this.handleError(error.message);
      } finally {
        this.loading = false;
      }
    },
	
    formatReportData(data) {
      return {
        score: data.score || 0,
        assessmentTime: data.assessmentTime || Date.now(),
        duration: data.duration || 0,
        metrics: data.metrics || [],
        summary: data.report || ''
      };
    },

    formatDate(timestamp) {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      return date.toISOString().split('T')[0];
    },

    getScoreColor(score) {
      if (score >= 90) return '#4CAF50';
      if (score >= 75) return '#2196F3';
      if (score >= 60) return '#FFC107';
      return '#FF5722';
    },

    handleError(message) {
      this.error = true;
      this.errorMessage = message || '加载失败，请稍后重试';
      this.loading = false;
    },

    retryLoading() {
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const options = currentPage.options;
      this.fetchReportData(options.recordId);
    },
	gotovideodetails(){
	   uni.navigateTo({
	   	url:`/pages/videodetail/videodetail?id=${this.recordId}`
	   })
	}
  }
};
</script>

<style>
.container {
  min-height: 100vh;
  background: #F8FAFC;
  position: relative;
  overflow: hidden;
}

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

.content {
  position: relative;
  z-index: 2;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 40rpx 30rpx;
  gap: 40rpx;
}

/* 总分区域新样式 */
.score-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: fadeInUp 0.8s ease-out;
  padding: 40rpx 0;
}

.total-score {
  margin-bottom: 30rpx;
}

.score-circle-wrapper {
  position: relative;
  padding: 15rpx;
}

.score-circle-outer {
  width: 240rpx;
  height: 240rpx;
  background: linear-gradient(135deg, rgba(255, 182, 193, 0.2), rgba(173, 216, 230, 0.2));
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 0 30rpx rgba(173, 216, 230, 0.3);
  position: relative;
  animation: pulse 3s ease-in-out infinite;
}

.score-circle-inner {
  width: 200rpx;
  height: 200rpx;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85));
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: inset 0 0 20rpx rgba(173, 216, 230, 0.2);
}

.score-content {
  text-align: center;
  animation: fadeIn 1s ease-out;
}

.score-number {
  font-size: 88rpx;
  font-weight: 700;
  background: linear-gradient(135deg, #6366F1, #8B5CF6);
  -webkit-background-clip: text;
  color: transparent;
  line-height: 1.2;
  margin-bottom: 4rpx;
}

.score-label {
  font-size: 28rpx;
  color: rgba(30, 41, 59, 0.7);
  font-weight: 500;
}

.score-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.score-date {
  font-size: 24rpx;
  color: rgba(30, 41, 59, 0.5);
}
.subject-name-container {
  margin: 30rpx auto 24rpx;
  text-align: center;
  background: #ffffff;
  border-radius: 12rpx;
  padding: 16rpx 28rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  max-width: 85%;
  position: relative;
  overflow: hidden;
  border: none;
  animation: fadeIn 0.5s ease-out;
}

/* 简化的顶部线条 */
.subject-name-container::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2rpx;
  background: #6366F1;
}

/* 移除底部装饰 */
.subject-label {
  font-size: 22rpx;
  color: #64748B;
  margin-bottom: 6rpx;
  font-weight: 500;
  display: block;
}

.subject-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #4F46E5;
  letter-spacing: 0.5rpx;
  padding: 2rpx 0;
  display: block;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(6rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
/* 其他样式保持不变 */
.metrics-section {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10rpx);
  border-radius: 30rpx;
  padding: 30rpx;
  animation: fadeInUp 0.8s ease-out 0.2s backwards;
  border: 1rpx solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1E293B;
  margin-bottom: 30rpx;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.metric-card {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 20rpx;
  padding: 20rpx;
  border: 1rpx solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.03);
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15rpx;
}

.metric-name {
  font-size: 28rpx;
  color: #1E293B;
}

.metric-score {
  font-size: 32rpx;
  font-weight: 600;
  color: #1E293B;
}

.metric-bar-bg {
  height: 8rpx;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4rpx;
  overflow: hidden;
}

.metric-bar {
  height: 100%;
  border-radius: 4rpx;
  transition: width 1s ease-out;
}

.evaluation-section {
  animation: fadeInUp 0.8s ease-out 0.4s backwards;
}

.evaluation-cards {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.evaluation-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10rpx);
  border-radius: 20rpx;
  padding: 25rpx;
  border: 1rpx solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.evaluation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.evaluation-aspect {
  font-size: 30rpx;
  font-weight: 600;
  color: #1E293B;
}

.evaluation-tag {
  padding: 4rpx 16rpx;
  border-radius: 30rpx;
  font-size: 24rpx;
}

.evaluation-tag.excellent {
  background: rgba(99, 102, 241, 0.1);
  color: #6366F1;
}

.evaluation-tag.good {
  background: rgba(139, 92, 246, 0.1);
  color: #8B5CF6;
}

.evaluation-content {
  color: #1E293B;
  font-size: 28rpx;
  line-height: 1.6;
}

.suggestion-box {
  margin-top: 20rpx;
  padding: 20rpx;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 16rpx;
}

.suggestion-title {
  font-size: 26rpx;
  color: rgba(30, 41, 59, 0.7);
  margin-bottom: 10rpx;
}

.suggestion-text {
  font-size: 26rpx;
  color: #1E293B;
  line-height: 1.6;
}

.summary-section {
  animation: fadeInUp 0.8s ease-out 0.6s backwards;
}

.summary-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10rpx);
  border-radius: 20rpx;
  padding: 25rpx;
  border: 1rpx solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.summary-text {
  font-size: 28rpx;
  color: #1E293B;
  line-height: 1.6;
}

.video-details {
  margin: 20rpx auto;
  padding: 20rpx 40rpx;
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  border-radius: 40rpx;
  text-align: center;
  color: #ffffff;
  font-size: 30rpx;
  font-weight: 500;
  letter-spacing: 2rpx;
  box-shadow: 0 8rpx 20rpx rgba(37, 117, 252, 0.3);
  transition: all 0.3s ease;
  max-width: 300rpx;
}

.video-details:active {
  transform: scale(0.95);
  box-shadow: 0 4rpx 10rpx rgba(37, 117, 252, 0.2);
}
@keyframes float {
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(30rpx, -30rpx);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 30rpx rgba(173, 216, 230, 0.3);
  }
  50% {
    transform: scale(1.02);
    box-shadow: 0 0 40rpx rgba(173, 216, 230, 0.4);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 30rpx rgba(173, 216, 230, 0.3);
  }
}

@keyframes glow {
  0% {
    box-shadow: 0 0 20rpx rgba(99, 102, 241, 0.2);
  }
  100% {
    box-shadow: 0 0 40rpx rgba(99, 102, 241, 0.3);
  }
}
</style>