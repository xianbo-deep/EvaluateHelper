<template>
  <view class="container">
    <view class="background">
      <view class="gradient-orb"></view>
      <view class="gradient-orb"></view>
    </view>

    <view class="content">
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
            totalscore: 0
        }
    },
    async onLoad() {
        const userId = store.userInfo._id;
        const deductResult = await uniCloud.callFunction({
          name: 'deductMemberTimes',
          data: {
            userId: store.userInfo._id
          }
        });
        
        if (deductResult.result.code !== 0) {
          return uni.showToast({
            title: deductResult.result.message || '扣减次数失败',
            icon: 'none'
          });
        }
        // 获取存储的评测数据
        const metricsData = uni.getStorageSync(`${userId}_metrics`);
		const recordId = uni.getStorageSync(`${userId}_recordId`);
        console.log('原始评测数据:', metricsData);
        
        if (metricsData && metricsData.length > 0) {
            // 设置总分（计算所有指标的平均分）
            this.totalscore = uni.getStorageSync(`${userId}_score`);
            // 格式化指标数据用于显示
            this.metrics = metricsData.map(m => ({
                name: m.metricname,
                score: m.score
            }));
            
            // 格式化详细评价数据 - 直接使用API返回的数据
            this.evaluationDetails = metricsData.map(m => ({
                aspect: m.metricname,
                level: m.description.level,
                levelText: m.description.level,
                evaluation: m.description.evaluation, 
                suggestion: m.description.suggestion
            }));
            
            // 设置评测时间
            this.assessmentTime = this.formatDate(new Date());
            
            // 生成总体评价 - 整合四个指标的评价
            const totalItem = metricsData.find(m => m.metricId === '总分' || m.metricname === '总体评价');
            if (totalItem) {
                // 如果有总分项，直接使用
                this.summary = totalItem.description.evaluation;
            } else {
                // 将所有指标的评价整合为一段总结
                const majorPoints = metricsData.map(m => {
                    const aspect = m.metricname;
                    const key = m.description.evaluation.split('，')[0]; // 取评价的第一部分作为关键点
                    return `${aspect}：${key}`;
                }).join('；');
                
                // 构建总结性评价
                this.summary = `总体表现良好，得分${this.totalscore}分。${majorPoints}。建议关注细节描述，增加专业术语，并加强与用户痛点的关联。`;
            }
            
            console.log('处理后的评测数据:', {
                metrics: this.metrics,
                details: this.evaluationDetails,
                totalscore: this.totalscore,
                summary: this.summary
            });
        } else {
            uni.showToast({
                title: '未找到评测数据',
                icon: 'none'
            });
        }
    },
	onBackPress() {
	    uni.switchTab({
	        url: "/pages/EvaluationHistoryPage/EvaluationHistoryPage",
	    });
	    return true;
	},
    methods: {
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