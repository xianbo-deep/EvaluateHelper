<template>
  <view class="history-container">
    <!-- 渐变背景 -->
    <view class="gradient-bg"></view>
    
    <!-- 记录列表 -->
    <scroll-view class="records-list" scroll-y="true">
      <view 
        class="record-card" 
        v-for="(record, index) in evaluationRecords" 
        :key="index"
        :style="{ animationDelay: index * 0.1 + 's' }"
      >
        <!-- 日期和时间 -->
        <view class="record-header">
          <text class="date">{{record.date}}</text>
          <text class="time">{{record.time}}</text>
        </view>

        <!-- 评分情况 -->
        <view class="score-section">
          <view class="score-ring">
            <text class="score-number">{{record.score}}</text>
            <text class="score-label">总分</text>
          </view>
        </view>

        <!-- 评测维度 -->
        <view class="dimensions">
          <view 
            class="dimension-item"
            v-for="(dimension, dIndex) in record.dimensions"
            :key="dIndex"
          >
            <text class="dimension-name">{{dimension.name}}</text>
            <view class="progress-bar-bg">
              <view 
                class="progress-bar" 
                :style="{ width: dimension.score + '%' }"
              ></view>
            </view>
            <text class="dimension-score">{{dimension.score}}%</text>
          </view>
        </view>

        <!-- 底部信息 -->
        <view class="record-footer">
          <view class="tag" :class="record.status === '已完成' ? 'completed' : 'ongoing'">
            {{record.status}}
          </view>
          <text class="duration">用时 {{record.duration}}</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { store } from '/uni_modules/uni-id-pages/common/store.js';
export default {
  data() {
    return {
      evaluationRecords: [
        {
          date: '2024-01-23',
          time: '14:30',
          score: 92,
          duration: '45分钟',
          status: '已完成',
          dimensions: [
            { name: '专业能力', score: 95 },
            { name: '沟通表达', score: 88 },
            { name: '逻辑思维', score: 92 },
            { name: '学习能力', score: 90 }
          ]
        },
        {
          date: '2024-01-20',
          time: '10:15',
          score: 88,
          duration: '38分钟',
          status: '已完成',
          dimensions: [
            { name: '专业能力', score: 85 },
            { name: '沟通表达', score: 90 },
            { name: '逻辑思维', score: 87 },
            { name: '学习能力', score: 89 }
          ]
        },
        // 可以添加更多记录
      ]
    }
  },
  onShow(){
	  if(!store.hasLogin){
		  uni.showToast({
		  	title: '请先登录',
			icon: 'none'
		  });
		  uni.switchTab({
		  	url: '/pages/MyPage/MyPage'
		  });
	  }
  }
}
</script>

<style>
.history-container {
  min-height: 100vh;
  background: #f8faff;
  padding: 30rpx;
  position: relative;
  overflow: hidden;
}

.gradient-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(238, 242, 255, 0.8), rgba(248, 250, 255, 0.8));
  z-index: 1;
}

.records-list {
  position: relative;
  z-index: 2;
  height: 100vh;
  padding: 20rpx 0;
}

.record-card {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(148, 163, 184, 0.1);
  animation: slideIn 0.6s ease forwards;
  opacity: 0;
  transform: translateY(20rpx);
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.date {
  font-size: 32rpx;
  color: #1e293b;
  font-weight: 600;
}

.time {
  font-size: 28rpx;
  color: #64748b;
}

.score-section {
  display: flex;
  justify-content: center;
  margin: 20rpx 0 30rpx;
}

.score-ring {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #818cf8, #6366f1);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  box-shadow: 0 6rpx 16rpx rgba(99, 102, 241, 0.2);
}

.score-number {
  font-size: 48rpx;
  color: #ffffff;
  font-weight: bold;
  line-height: 1;
}

.score-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
  margin-top: 8rpx;
}

.dimensions {
  margin: 30rpx 0;
}

.dimension-item {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.dimension-name {
  width: 140rpx;
  font-size: 26rpx;
  color: #475569;
}

.progress-bar-bg {
  flex: 1;
  height: 12rpx;
  background: #e2e8f0;
  border-radius: 6rpx;
  margin: 0 20rpx;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #818cf8, #6366f1);
  border-radius: 6rpx;
  transition: width 0.6s ease;
}

.dimension-score {
  font-size: 26rpx;
  color: #64748b;
  width: 70rpx;
  text-align: right;
}

.record-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 30rpx;
  padding-top: 20rpx;
  border-top: 2rpx solid #f1f5f9;
}

.tag {
  padding: 8rpx 24rpx;
  border-radius: 30rpx;
  font-size: 24rpx;
}

.completed {
  background: rgba(34, 197, 94, 0.1);
  color: #16a34a;
}

.ongoing {
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
}

.duration {
  font-size: 24rpx;
  color: #64748b;
}

@keyframes slideIn {
  0% {
    opacity: 0;
    transform: translateY(20rpx);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>