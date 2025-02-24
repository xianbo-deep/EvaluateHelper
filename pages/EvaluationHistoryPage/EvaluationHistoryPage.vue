<template>
  <view class="history-container">
    <!-- 渐变背景 -->
    <view class="gradient-bg"></view>
    
    <!-- 记录列表 -->
    <scroll-view class="records-list" scroll-y="true">
      <view 
        class="record-card" 
        v-for="(record, index) in evaluationRecords" 
        :key="record.recordId" 
        @tap="goToReport(record.recordId)"
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
          <view class="tag completed">已完成</view>
          <text class="duration">用时 {{record.duration}}分钟</text>
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
      evaluationRecords: [], // 记录数据
    };
  },
  
  onShow() {
    // 检查用户是否已登录
    if (!store.hasLogin) {
      uni.showToast({ title: '请先登录', icon: 'none' });
      uni.switchTab({ url: '/pages/MyPage/MyPage' });
      return;
    }
    
    // 获取测评记录
    this.fetchEvaluationRecords();
  },

  methods: {
    // 获取测评记录
    async fetchEvaluationRecords() {
      try {
        uni.showLoading({ title: '加载中' });
    
        const userId = store.userInfo._id;
        
        const res = await uniCloud.callFunction({
          name: 'GetRecords',
          data: { userId }
        });
    
        if (!res.result.success) {
          uni.showToast({ title: '获取数据失败', icon: 'none' });
          return;
        }
        console.log(res.result.data)
        if (res.result.data.length === 0) {
          this.evaluationRecords = [];
          uni.showToast({ title: '暂无测评记录', icon: 'none' });
          return;
        }
    
        this.evaluationRecords = res.result.data.map(item => ({
          recordId: item.recordId,
          date: this.formatDate(item.assessmentTime),
          time: this.formatTime(item.assessmentTime),
          score: item.score ?? '未评分',
          duration: item.duration || '未知',
          dimensions: item.dimensions || [] //  直接获取数组
        }));
		console.log("Formatted Records:", this.evaluationRecords);

    
      } catch (error) {
        console.error('获取测评记录失败:', error);
        uni.showToast({ title: '数据加载失败', icon: 'none' });
      } finally {
        uni.hideLoading();
      }
    },

    // 点击跳转到测评报告详情
    goToReport(recordId) {
      uni.navigateTo({
        url: `/pages/details/details?recordId=${recordId}`
      });
    },

    // 格式化日期
    formatDate(timestamp) {
      const date = new Date(timestamp);
      return date.toISOString().split('T')[0];
    },

    // 格式化时间
    formatTime(timestamp) {
      const date = new Date(timestamp);
      return date.toTimeString().split(' ')[0];
    }
  }
};
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