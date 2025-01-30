<template>
  <view class="container">
    <!-- 背景层 -->
    <view class="background">
      <view class="gradient-orb"></view>
      <view class="gradient-orb"></view>
      <view class="gradient-orb"></view>
      <view class="grid-overlay"></view>
    </view>

    <view class="content">
      <!-- 品牌区 -->
      <view class="brand-section">
        <view class="logo">
          <view class="logo-ring"></view>
          <view class="logo-pulse"></view>
          <view class="logo-core"></view>
          <view class="logo-glow"></view>
        </view>
        <view class="brand-text">
          <text class="brand-name">Nova</text>
          <text class="brand-tagline">以智赋能 重构未来</text>
        </view>
      </view>

      <!-- 功能卡片区 -->
      <view class="cards">
        <view 
          class="card start-card" 
          @click="navigateTo('start-test')" 
          hover-class="card-hover"
        >
          <view class="card-glow"></view>
          <view class="card-content">
            <view class="card-icon start-icon">
              <view class="icon-pulse"></view>
            </view>
            <view class="card-text">
              <text class="card-title">开始测评</text>
            </view>
            <view class="card-arrow"></view>
          </view>
        </view>

        <view 
          class="card report-card" 
          @click="navigateTo('my-reports')" 
          hover-class="card-hover"
        >
          <view class="card-glow"></view>
          <view class="card-content">
            <view class="card-icon report-icon">
              <view class="icon-pulse"></view>
            </view>
            <view class="card-text">
              <text class="card-title">查看报告</text>
            </view>
            <view class="card-arrow"></view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { store } from '/uni_modules/uni-id-pages/common/store.js';	

export default {
  methods: {
    navigateTo(moduleId) {
      // 检查登录状态
      if (!store.hasLogin) {
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        });
        // 跳转到我的页面
        uni.switchTab({
          url: '/pages/MyPage/MyPage'
        });
        return;
      }

      // 已登录，执行正常导航
      const routes = {
        'start-test': '/pages/EvaluationPage/EvaluationPage',
        'my-reports': '/pages/EvaluationHistoryPage/EvaluationHistoryPage'
      };

      if (moduleId === 'my-reports') {
        uni.switchTab({
          url: routes[moduleId],
          fail: (err) => {
            console.error('Navigation failed:', err);
            uni.showToast({
              title: '页面跳转失败',
              icon: 'none'
            });
          }
        });
      } else {
        uni.navigateTo({
          url: routes[moduleId],
          fail: (err) => {
            console.error('Navigation failed:', err);
            uni.showToast({
              title: '页面跳转失败',
              icon: 'none'
            });
          }
        });
      }
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
  filter: blur(80rpx);
}

.gradient-orb:nth-child(1) {
  width: 800rpx;
  height: 800rpx;
  background: linear-gradient(135deg, rgba(91, 33, 182, 0.1), rgba(67, 56, 202, 0.05));
  top: -300rpx;
  right: -200rpx;
  animation: float1 20s ease-in-out infinite alternate;
}

.gradient-orb:nth-child(2) {
  width: 600rpx;
  height: 600rpx;
  background: linear-gradient(225deg, rgba(99, 102, 241, 0.08), rgba(79, 70, 229, 0.05));
  bottom: -200rpx;
  left: -100rpx;
  animation: float2 15s ease-in-out infinite alternate-reverse;
}

.gradient-orb:nth-child(3) {
  width: 400rpx;
  height: 400rpx;
  background: linear-gradient(45deg, rgba(139, 92, 246, 0.06), rgba(99, 102, 241, 0.03));
  top: 30%;
  right: 20%;
  animation: float3 18s ease-in-out infinite alternate;
}

.grid-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px);
  background-size: 40rpx 40rpx;
  opacity: 0.3;
}

.content {
  position: relative;
  z-index: 2;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 60rpx 40rpx;
}

/* 品牌区域 */
.brand-section {
  text-align: center;
  margin-top: 60rpx;
  margin-bottom: 100rpx;
  animation: fadeInUp 0.8s ease-out;
}

.logo {
  width: 140rpx;
  height: 140rpx;
  margin: 0 auto 30rpx;
  position: relative;
}

.logo-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 6rpx solid transparent;
  border-top-color: rgba(139, 92, 246, 0.8);
  border-right-color: rgba(99, 102, 241, 0.6);
  animation: spin 3s linear infinite;
}

.logo-pulse {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(139, 92, 246, 0.2);
  animation: pulse 2s ease-in-out infinite;
}

.logo-core {
  position: absolute;
  width: 60%;
  height: 60%;
  top: 20%;
  left: 20%;
  background: linear-gradient(135deg, #8B5CF6, #6366F1);
  border-radius: 50%;
  animation: glow 4s ease-in-out infinite alternate;
}

.logo-glow {
  position: absolute;
  width: 140%;
  height: 140%;
  top: -20%;
  left: -20%;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%);
  animation: rotate 10s linear infinite;
}

.brand-name {
  font-size: 72rpx;
  font-weight: 700;
  color: #1E293B;
  display: block;
  margin-bottom: 16rpx;
  letter-spacing: 4rpx;
  text-shadow: 0 0 20rpx rgba(139, 92, 246, 0.2);
  background: linear-gradient(135deg, #1E293B 0%, rgba(30, 41, 59, 0.8) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.brand-tagline {
  font-size: 32rpx;
  color: rgba(30, 41, 59, 0.7);
  display: block;
  letter-spacing: 2rpx;
}

/* 卡片区域 */
.cards {
  display: flex;
  flex-direction: column;
  gap: 40rpx;
  padding: 0 20rpx;
  margin: auto 0;
  animation: fadeInUp 0.8s ease-out 0.2s backwards;
}

.card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10rpx);
  border-radius: 30rpx;
  padding: 40rpx;
  position: relative;
  border: 1rpx solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.card-glow {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.1),
    transparent
  );
  transition: 0.5s;
}

.card:hover .card-glow {
  left: 100%;
}

.card-hover {
  transform: scale(0.98) translateY(2rpx);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 30rpx rgba(139, 92, 246, 0.15);
}

.card-content {
  display: flex;
  align-items: center;
  gap: 30rpx;
  position: relative;
  z-index: 1;
}

.card-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 20rpx;
  position: relative;
}

.icon-pulse {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  background: inherit;
  opacity: 0.5;
  animation: iconPulse 2s ease-in-out infinite;
}

.start-icon {
  background: linear-gradient(135deg, #8B5CF6, #6366F1);
}

.report-icon {
  background: linear-gradient(135deg, #6366F1, #4F46E5);
}

.card-text {
  flex: 1;
}

.card-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #1E293B;
  text-shadow: none;
}

.card-arrow {
  width: 20rpx;
  height: 20rpx;
  border-right: 3rpx solid rgba(30, 41, 59, 0.6);
  border-top: 3rpx solid rgba(30, 41, 59, 0.6);
  transform: rotate(45deg);
  transition: transform 0.3s ease;
}

.card:hover .card-arrow {
  transform: rotate(45deg) translate(4rpx, -4rpx);
}

/* 动画关键帧 */
@keyframes float1 {
  0% { transform: translate(0, 0) rotate(0deg); }
  100% { transform: translate(40rpx, -40rpx) rotate(5deg); }
}

@keyframes float2 {
  0% { transform: translate(0, 0) rotate(0deg); }
  100% { transform: translate(-30rpx, 30rpx) rotate(-5deg); }
}

@keyframes float3 {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(20rpx, -20rpx) scale(1.1); }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0% { transform: scale(0.95); opacity: 0.5; }
  50% { transform: scale(1.05); opacity: 0.8; }
  100% { transform: scale(0.95); opacity: 0.5; }
}

@keyframes glow {
  0% { box-shadow: 0 0 20rpx rgba(139, 92, 246, 0.5); }
  100% { box-shadow: 0 0 40rpx rgba(139, 92, 246, 0.8); }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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

@keyframes iconPulse {
  0% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.5); opacity: 0; }
  100% { transform: scale(1); opacity: 0.5; }
}
</style>