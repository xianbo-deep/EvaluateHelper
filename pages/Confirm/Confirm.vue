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
        <view class="title-container">
          <text class="title">确认评测套餐</text>
        </view>
        <text class="subtitle">{{ hasPackage ? '请确认您选择的套餐信息' : '您还未选择套餐' }}</text>
      </view>

      <!-- 根据是否有套餐显示不同内容 -->
      <block v-if="hasPackage">
        <!-- 套餐信息 -->
        <view class="package-info">
          <view class="package-card" :style="{ animationDelay: '0.2s' }">
            <view class="package-header">
              <view class="package-icon" :style="{ background: getGradient(0) }">
                <text class="icon-text">{{ packageInfo.package_name.substr(0, 1) }}</text>
              </view>
              <text class="package-name">{{ packageInfo.package_name }}</text>
            </view>
            <view class="package-desc">
              <text class="desc-text">{{ packageInfo.description }}</text>
            </view>
          </view>
        </view>
      </block>
      <block v-else>
        <!-- 无套餐时的提示 -->
        <view class="empty-state">
          <text class="empty-text">请先选择评测套餐</text>
        </view>
      </block>

      <!-- 底部按钮 -->
      <view class="bottom-section">
        <button class="next-btn" @tap="handleButtonClick">
          {{ hasPackage ? '确认' : '选择套餐' }}
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
      packageInfo: {},
      hasPackage: false
    }
  },
  onShow() {
    const userId = store.userInfo._id;
    const cachedPackage = uni.getStorageSync(`${userId}_selectedPackage`);
    if (cachedPackage) {
      this.packageInfo = cachedPackage;
      this.hasPackage = true;
    } else {
      this.hasPackage = false;
      this.packageInfo = {};
    }
  },
  onBackPress({from}) {
    uni.switchTab({
      url: '/pages/HomePage/HomePage'
    });
    return true;
  },
  methods: {
    handleModify() {
      uni.navigateTo({
        url: '/pages/Metric/Metric'
      });
    },
    async handleButtonClick() {
      try {
        if (this.hasPackage) {
          const res = await uniCloud.callFunction({
            name: 'getMemberInfo',
            data: {
              userId: store.userInfo._id
            }
          });
    
          if (res.result.code === 0) {
            const memberInfo = res.result.data;
            
            if (memberInfo.membertype === 'times') {
              if (memberInfo.remainingTimes <= 0) {
                return uni.showToast({
                  title: '次数已用完，请充值',
                  icon: 'none'
                });
              }
              
            } 
            else if (memberInfo.memberStatus !== 'active') {
              return uni.showToast({
                title: '请先开通会员',
                icon: 'none'
              });
            }
    
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
		  uni.showToast({
		  	title:'请先选择套餐',
			duration:2000
		  })
          uni.navigateTo({
            url: '/pages/Metric/Metric'
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
        'linear-gradient(135deg, #7C3AED, #6D28D9)'
      ];
      return gradients[index % gradients.length];
    }
  }
}
</script>

<style>
.metrics-container {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.background {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #F3F4F6;
  overflow: hidden;
}

.gradient-orb {
  position: absolute;
  width: 600rpx;
  height: 600rpx;
  border-radius: 50%;
  filter: blur(100rpx);
  opacity: 0.15;
}

.gradient-orb:nth-child(1) {
  background: #8B5CF6;
  top: -200rpx;
  left: -200rpx;
}

.gradient-orb:nth-child(2) {
  background: #6366F1;
  top: 60%;
  right: -300rpx;
}

.gradient-orb:nth-child(3) {
  background: #7C3AED;
  bottom: -200rpx;
  left: 30%;
}

.content {
  position: relative;
  min-height: 100vh;
  padding: 40rpx;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding-bottom: 120rpx;
}

.header-section {
  margin-bottom: 40rpx;
}

.title-container {
  display: flex;
  justify-content: center;
  width: 100%;
  margin-bottom: 16rpx;
}

.title {
  font-size: 48rpx;
  font-weight: 600;
  color: #1F2937;
  text-align: center;
}

.subtitle {
  font-size: 28rpx;
  color: #6B7280;
  display: block;
  text-align: center;
  margin-bottom: 40rpx;
}

.package-info {
  flex: 1;
  padding: 20rpx 0;
}

.package-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  animation: slideUp 0.5s ease-out forwards;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.package-header {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
}

.package-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}

.icon-text {
  color: #FFFFFF;
  font-size: 36rpx;
  font-weight: 600;
}

.package-name {
  font-size: 36rpx;
  font-weight: 600;
  color: #1F2937;
}

.package-desc {
  padding: 24rpx;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 16rpx;
}

.desc-text {
  font-size: 28rpx;
  color: #4B5563;
  line-height: 1.6;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-text {
  font-size: 32rpx;
  color: #6B7280;
}

.bottom-section {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 40rpx;
  padding: 0 32rpx;
  padding-bottom: env(safe-area-inset-bottom);
}

.modify-btn {
  background: rgba(99, 102, 241, 0.1);
  color: #6366F1;
  height: 88rpx;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.next-btn {
  background: linear-gradient(135deg, #8B5CF6, #6366F1);
  color: #FFFFFF;
  height: 100rpx;
  border-radius: 50rpx;
  font-size: 36rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  width: 90%;
  margin: 0 auto;
  box-shadow: 0 4rpx 20rpx rgba(139, 92, 246, 0.3);
}

.btn-arrow {
  width: 16rpx;
  height: 16rpx;
  border-right: 3rpx solid #FFFFFF;
  border-top: 3rpx solid #FFFFFF;
  transform: rotate(45deg);
  margin-left: 12rpx;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(40rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>