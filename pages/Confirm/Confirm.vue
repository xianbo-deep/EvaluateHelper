<template>
  <view class="metrics-container">
    <!-- 背景渐变 -->
    <view class="background">
      <view class="gradient-orb"></view>
      <view class="gradient-orb"></view>
      <view class="gradient-orb"></view>
    </view>

    <!-- 主要内容 -->
    <view class="content">
      <!-- 顶部说明 -->
      <view class="header-section">
        <text class="title">我的评测指标</text>
        <text class="subtitle">{{ hasMetrics ? '您将从以下维度进行评测' : '您还未设置指标' }}</text>
      </view>

      <!-- 根据是否有指标显示不同内容 -->
      <block v-if="hasMetrics">
        <!-- 指标列表 -->
        <scroll-view class="metrics-list" scroll-y="true">
          <view 
            class="metrics-row" 
            v-for="(row, rowIndex) in groupedMetrics" 
            :key="rowIndex"
          >
            <view 
              class="metric-item" 
              v-for="(metric, colIndex) in row" 
              :key="rowIndex + '-' + colIndex"
              :style="{ animationDelay: (rowIndex * 2 + colIndex) * 0.1 + 's' }"
            >
              <view class="metric-icon" :style="{ background: getGradient(rowIndex * 2 + colIndex) }"></view>
              <view class="metric-content">
                <text class="metric-name">{{ metric.name }}</text>
                <text class="metric-desc">{{ metric.description }}</text>
              </view>
            </view>
          </view>
        </scroll-view>
      </block>
      <block v-else>
        <!-- 无指标时的提示 -->
        <view class="empty-state">
          <text class="empty-text">请先设置您的评测指标</text>
        </view>
      </block>

      <!-- 底部按钮 -->
      <view class="bottom-section">
        <button class="next-btn" @tap="handleButtonClick">
          {{ hasMetrics ? '开始评测' : '设置指标' }}
          <view class="btn-arrow"></view>
        </button>
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
      hasMetrics: false
    }
  },
  computed: {
    groupedMetrics() {
      const groups = [];
      for (let i = 0; i < this.metrics.length; i += 2) {
        groups.push(this.metrics.slice(i, i + 2));
      }
      return groups;
    }
  },
  onShow(){
	const userId = store.userInfo._id; 
    const cachedMetrics = uni.getStorageSync(`${userId}_metricData`);
    if (cachedMetrics && cachedMetrics.length > 0) {
      this.metrics = cachedMetrics.map(item => ({
        name: item.name,
        description: item.description
      }));
      this.hasMetrics = true;
    } else {
      this.hasMetrics = false;
      this.metrics = [];
    }
  },
  onBackPress(options){
    uni.switchTab({
      url: '/pages/HomePage/HomePage'
    });
	return true;
  },
  methods: {
    async handleButtonClick() {
      try {
        if (this.hasMetrics) {
          const res = await uniCloud.callFunction({
            name: 'getMemberInfo',
            data: {
              userId: store.userInfo._id
            }
          });
    
          if (res.result.code === 0) {
            const memberInfo = res.result.data;
            
            // 检查是否是次卡会员
            if (memberInfo.membertype === 'times') {
              if (memberInfo.remainingTimes <= 0) {
                return uni.showToast({
                  title: '次数已用完，请充值',
                  icon: 'none'
                });
              }
              
              // 扣减次数
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
            } 
            // 如果不是次卡会员，检查会员是否有效
            else if (memberInfo.memberStatus !== 'active') {
              return uni.showToast({
                title: '请先开通会员',
                icon: 'none'
              });
            }
    
            // 导航到加载页面
            uni.navigateTo({
              url: '/pages/Loading/Loading'
            });
          } else {
            uni.showToast({
              title: res.result.message || '获取会员信息失败',
              icon: 'none'
            });
          }
        } else {
          // 如果没有指标数据，跳转到指标页面
          uni.navigateTo({
            url: '/pages/Metric/Metric',
            fail: (err) => {
              uni.showToast({
                title: '跳转失败，请重试',
                icon: 'none'
              });
            }
          });
        }
      } catch (error) {
        console.error('操作失败:', error);
        uni.showToast({
          title: '操作失败，请重试',
          icon: 'none'
        });
      }
    },
    getGradient(index) {
      const gradients = [
        'linear-gradient(135deg, #8B5CF6, #6366F1)',
        'linear-gradient(135deg, #6366F1, #4F46E5)',
        'linear-gradient(135deg, #7C3AED, #6D28D9)',
        'linear-gradient(135deg, #818CF8, #6366F1)',
        'linear-gradient(135deg, #A78BFA, #8B5CF6)',
        'linear-gradient(135deg, #9333EA, #7C3AED)'
      ];
      return gradients[index % gradients.length];
    }
  }
}
</script>

<style>
.metrics-container {
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
  animation: float1 20s ease-in-out infinite alternate;
}

.gradient-orb:nth-child(2) {
  width: 500rpx;
  height: 500rpx;
  background: linear-gradient(225deg, rgba(99, 102, 241, 0.08), rgba(79, 70, 229, 0.05));
  bottom: -150rpx;
  left: -100rpx;
  animation: float2 15s ease-in-out infinite alternate-reverse;
}

.gradient-orb:nth-child(3) {
  width: 400rpx;
  height: 400rpx;
  background: linear-gradient(45deg, rgba(139, 92, 246, 0.06), rgba(99, 102, 241, 0.03));
  top: 40%;
  left: 60%;
  animation: float3 18s ease-in-out infinite alternate;
}

/* 主要内容 */
.content {
  position: relative;
  z-index: 2;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 40rpx;
}

.header-section {
  margin: 40rpx 0 60rpx;
  text-align: center;
  animation: fadeInUp 0.8s ease-out;
}

.title {
  font-size: 48rpx;
  font-weight: 600;
  color: #1E293B;
  display: block;
  margin-bottom: 16rpx;
  letter-spacing: 2rpx;
}

.subtitle {
  font-size: 28rpx;
  color: rgba(30, 41, 59, 0.7);
  display: block;
}

.metrics-list {
  flex: 1;
  padding: 20rpx 10rpx;
}

.metrics-row {
  display: flex;
  margin-bottom: 30rpx;
  gap: 30rpx;
  padding: 0 10rpx;
}

.metric-item {
  flex: 1;
  padding: 40rpx;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10rpx);
  border-radius: 30rpx;
  border: 1rpx solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: slideUp 0.5s ease forwards;
  opacity: 0;
  transform: translateY(20rpx);
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 24rpx;
}

.metric-item:active {
  transform: scale(0.98) translateY(2rpx);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 20rpx rgba(139, 92, 246, 0.15);
}

.metric-icon {
  width: 64rpx;
  height: 64rpx;
  border-radius: 16rpx;
  flex-shrink: 0;
}

.metric-content {
  flex: 1;
  min-width: 0;
}

.metric-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #1E293B;
  margin-bottom: 8rpx;
  display: block;
}

.metric-desc {
  font-size: 26rpx;
  color: rgba(30, 41, 59, 0.7);
  line-height: 1.5;
  display: block;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
  animation: fadeInUp 0.8s ease-out;
}

.empty-text {
  font-size: 32rpx;
  color: rgba(30, 41, 59, 0.7);
  text-align: center;
}

.bottom-section {
  padding: 40rpx 0;
  animation: fadeInUp 0.8s ease-out 0.4s backwards;
}

.next-btn {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  text-align: center;
  background: linear-gradient(135deg, #8B5CF6, #6366F1);
  color: #FFFFFF;
  font-size: 32rpx;
  font-weight: 600;
  border-radius: 48rpx;
  letter-spacing: 2rpx;
  box-shadow: 0 4rpx 12rpx rgba(139, 92, 246, 0.2);
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.next-btn:active {
  transform: scale(0.98) translateY(2rpx);
  box-shadow: 0 2rpx 8rpx rgba(139, 92, 246, 0.15);
  background: linear-gradient(135deg, #7C3AED, #4F46E5);
}

.btn-arrow {
  width: 20rpx;
  height: 20rpx;
  border-right: 3rpx solid #FFFFFF;
  border-top: 3rpx solid #FFFFFF;
  transform: rotate(45deg);
  margin-left: 12rpx;
  position: relative;
  top: -2rpx;
}

/* 动画效果 */
@keyframes float1 {
  0% { transform: translate(0, 0) rotate(0deg); }
  100% { transform: translate(30rpx, -30rpx) rotate(5deg); }
}

@keyframes float2 {
  0% { transform: translate(0, 0) rotate(0deg); }
  100% { transform: translate(-20rpx, 20rpx) rotate(-5deg); }
}

@keyframes float3 {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(20rpx, -20rpx) scale(1.1); }
}

@keyframes slideUp {
  0% {
    opacity: 0;
    transform: translateY(20rpx);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
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
</style>