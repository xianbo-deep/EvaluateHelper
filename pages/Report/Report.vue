<template>
  <view class="container">
    <view class="background">
      <view class="gradient-orb"></view>
      <view class="gradient-orb"></view>
    </view>

    <!-- 加载状态显示 -->
    <view v-if="isLoading" class="loading-container">
      <view class="loading-spinner">
        <view class="spinner-circle"></view>
      </view>
      <text class="loading-text">加载中</text>
    </view>

    <view v-else-if="loadError" class="error-container">
      <text class="error-text">{{errorMessage}}</text>
      <button class="retry-button" @tap="retryLoading">重试</button>
    </view>

    <view v-else class="content">
      <!-- 总分区域 -->
      <view class="score-section">
        <view class="total-score">
          <view class="score-circle-wrapper">
            <view class="score-circle-outer">
              <view class="score-circle-inner">
                <view class="score-content">
                  <view class="score-number">{{totalscore}}</view>
                  <view class="score-label">总分</view>
                </view>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 优化后的评测对象名称 -->
        <view class="subject-name-container">
          <view class="subject-label">评测对象</view>
          <view class="subject-name">{{name}}</view>
        </view>
        
        <view class="score-info">
          <view class="score-date">评测时间：{{assessmentTime}}</view>
        </view>
      </view>

      <!-- 分项指标评分 -->
      <view class="metrics-section">
        <view class="section-title">能力指标</view>
        <view class="metrics-grid">
          <view class="metric-card" v-for="metric in metrics" :key="metric.name">
            <view class="metric-header">
              <text class="metric-name">{{metric.name}}</text>
              <text class="metric-score">{{metric.score}}</text>
            </view>
            <view class="metric-bar-bg">
              <view class="metric-bar" :style="{ width: metric.score + '%', backgroundColor: getScoreColor(metric.score) }"></view>
            </view>
          </view>
        </view>
      </view>

      <!-- 详细评价建议 -->
      <view class="evaluation-section">
        <view class="section-title">详细评价</view>
        <view class="evaluation-cards">
          <view class="evaluation-card" v-for="detail in evaluationDetails" :key="detail.aspect">
            <view class="evaluation-header">
              <view class="evaluation-aspect">{{detail.aspect}}</view>
              <view class="evaluation-tag" :class="detail.level">{{detail.levelText}}</view>
            </view>
            <view class="evaluation-content">
              <text class="evaluation-text">{{detail.evaluation}}</text>
              <view class="suggestion-box">
                <view class="suggestion-title">提升建议</view>
                <text class="suggestion-text">{{detail.suggestion}}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 总体评价 -->
      <view class="summary-section">
        <view class="section-title">总体评价</view>
        <view class="summary-card">
          <text class="summary-text">{{summary}}</text>
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
      metrics: [],
      evaluationDetails: [],
      summary: '',
      assessmentTime: '',
      totalscore: 0,
      name: '',
      isLoading: true,
      loadError: false,
      errorMessage: '加载失败，请重试'
    }
  },
  async onLoad() {
    this.loadData();
  },
  onBackPress() {
    uni.switchTab({
      url: "/pages/EvaluationHistoryPage/EvaluationHistoryPage",
    });
    return true;
  },
  methods: {
    async loadData() {
      this.isLoading = true;
      this.loadError = false;
      
      try {
        const userId = store.userInfo._id;
        
        // 扣减会员次数
        const deductResult = await uniCloud.callFunction({
          name: 'deductMemberTimes',
          data: {
            userId: userId
          }
        });
        
        if (deductResult.result.code !== 0) {
          throw new Error(deductResult.result.message || '扣减次数失败');
        }
        
        // 获取存储的评测数据
        const metricsData = uni.getStorageSync(`${userId}_metrics`);
        const recordId = uni.getStorageSync(`${userId}_recordId`);
        
        if (!metricsData || metricsData.length === 0) {
          throw new Error('未找到评测数据');
        }
        
        // 获取名称
        const { result } = await uniCloud.database().collection('AssessmentRecord')
          .where({recordId: recordId})
          .field('name')
          .get();
          
        if (!result.data || result.data.length === 0) {
          throw new Error('未找到评测记录');
        }
        
        this.name = result.data[0].name;
        
        // 设置总分
        this.totalscore = uni.getStorageSync(`${userId}_score`);
        
        // 格式化指标数据
        this.metrics = metricsData.map(m => ({
          name: m.metricname,
          score: m.score
        }));
        
        // 格式化详细评价数据
        this.evaluationDetails = metricsData.map(m => ({
          aspect: m.metricname,
          level: m.description.level,
          levelText: m.description.level,
          evaluation: m.description.evaluation, 
          suggestion: m.description.suggestion
        }));
        
        // 设置评测时间
        this.assessmentTime = this.formatDate(new Date());
        
        // 生成总体评价
        const totalItem = metricsData.find(m => m.metricId === '总分' || m.metricname === '总体评价');
        if (totalItem) {
          this.summary = totalItem.description.evaluation;
        } else {
          const majorPoints = metricsData.map(m => {
            const aspect = m.metricname;
            const key = m.description.evaluation.split('，')[0];
            return `${aspect}：${key}`;
          }).join('；');
          
          this.summary = `总体表现良好，得分${this.totalscore}分。${majorPoints}。建议关注细节描述，增加专业术语，并加强与用户痛点的关联。`;
        }
        
        console.log('处理后的评测数据:', {
          metrics: this.metrics,
          details: this.evaluationDetails,
          totalscore: this.totalscore,
          summary: this.summary
        });
        
      } catch (error) {
        console.error('获取报告详情失败:', error);
        this.loadError = true;
        this.errorMessage = error.message || '加载数据失败';
        
        uni.showToast({
          title: this.errorMessage,
          icon: 'none'
        });
      } finally {
        this.isLoading = false;
      }
    },
    
    retryLoading() {
      this.loadData();
    },
    
    getScoreColor(score) {
      if (score >= 90) return '#6366F1';
      if (score >= 80) return '#8B5CF6';
      if (score >= 70) return '#EC4899';
      return '#EF4444';
    },
    
    formatDate(date) {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
}
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

/* 加载状态样式 */
.loading-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(248, 250, 252, 0.8);
  z-index: 10;
}

.loading-spinner {
  width: 100rpx;
  height: 100rpx;
  position: relative;
  margin-bottom: 30rpx;
}

.spinner-circle {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 6rpx solid transparent;
  border-top-color: #6366F1;
  border-left-color: #8B5CF6;
  animation: spin 1.2s linear infinite;
}

.spinner-circle:before {
  content: "";
  position: absolute;
  top: 5rpx;
  left: 5rpx;
  right: 5rpx;
  bottom: 5rpx;
  border-radius: 50%;
  border: 6rpx solid transparent;
  border-top-color: #8B5CF6;
  animation: spin 0.8s linear infinite reverse;
}

.loading-text {
  font-size: 28rpx;
  color: #64748B;
  font-weight: 500;
}

/* 错误状态样式 */
.error-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(248, 250, 252, 0.9);
  z-index: 10;
  padding: 40rpx;
}

.error-text {
  font-size: 30rpx;
  color: #EF4444;
  margin-bottom: 40rpx;
  text-align: center;
}

.retry-button {
  background: #6366F1;
  color: white;
  border: none;
  border-radius: 10rpx;
  padding: 16rpx 36rpx;
  font-size: 28rpx;
  font-weight: 500;
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

/* 其他样式 */
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
    transform: translateY(6rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
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

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>