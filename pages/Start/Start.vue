<template>
  <view class="container" @tap="handleswitch">
    <!-- 背景动画层 -->
    <view class="background">
      <view class="circle" v-for="(item, index) in 8" :key="index"
            :style="{ 
              left: item.left + '%',
              top: item.top + '%',
              width: item.size + 'rpx',
              height: item.size + 'rpx',
              animationDelay: index * 0.3 + 's',
              background: item.color,
              animationDuration: item.duration + 's'
            }">
      </view>
    </view>

    <!-- 光效层 -->
    <view class="light-effect"></view>

    <!-- 主要内容区 -->
    <view class="content" :class="{ 'show-content': showContent }">
      <!-- Logo区域 -->
      <view class="logo-area">
        <view class="logo-container">
          <text class="logo-text" :class="{ 'text-animation': showContent }" 
                :style="{ animationDelay: index * 0.12 + 's' }" 
                v-for="(char, index) in 'Nova'" 
                :key="index">{{ char }}</text>
        </view>
      </view>

      <!-- 标语区域 -->
      <view class="slogan-container" :class="{ 'show-slogan': showContent }">
        <text class="slogan-text">让创新改变世界</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      showContent: false,
      circles: [
        { left: 10, top: 10, color: 'rgba(200, 200, 200, 0.07)', size: 400, duration: 20 },
        { left: 85, top: 15, color: 'rgba(200, 200, 200, 0.05)', size: 300, duration: 23 },
        { left: 20, top: 50, color: 'rgba(200, 200, 200, 0.07)', size: 280, duration: 19 },
        { left: 70, top: 70, color: 'rgba(200, 200, 200, 0.06)', size: 350, duration: 22 },
        { left: 50, top: 30, color: 'rgba(200, 200, 200, 0.05)', size: 320, duration: 21 },
        { left: 30, top: 80, color: 'rgba(200, 200, 200, 0.06)', size: 250, duration: 24 },
        { left: 65, top: 40, color: 'rgba(200, 200, 200, 0.07)', size: 380, duration: 18 },
        { left: 5, top: 60, color: 'rgba(200, 200, 200, 0.05)', size: 290, duration: 25 }
      ]
    }
  },
  onLoad() {
    this.initializeApp()
  },
  methods: {
    async initializeApp() {
      setTimeout(() => {
        this.showContent = true
      }, 300)
    },
	handleswitch(){
		uni.switchTab({
		  url: '/pages/HomePage/HomePage',
		  success: () => {
			console.log('跳转成功')
		  },
		  fail: (err) => {
			console.error('跳转失败:', err)
		  }
		})
	}
  }
}
</script>

<style>
.container {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #fcfcfc 0%, #f5f5f5 100%);
  position: relative;
  overflow: hidden;
}

.background {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.circle {
  position: absolute;
  border-radius: 50%;
  animation: floatAndRotate infinite ease-in-out;
  filter: blur(40px);
  opacity: 0.8;
}

.light-effect {
  position: absolute;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 50% 50%, 
    rgba(255, 255, 255, 0.8) 0%,
    rgba(255, 255, 255, 0.3) 50%,
    rgba(255, 255, 255, 0) 100%);
  z-index: 2;
  opacity: 0.5;
  animation: breathe 8s infinite ease-in-out;
}

.content {
  position: relative;
  z-index: 3;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: translateY(20rpx);
  transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.show-content {
  opacity: 1;
  transform: translateY(0);
}

.logo-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 80rpx;
  position: relative;
}

.logo-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  position: relative;
}

.logo-text {
  font-size: 140rpx;
  font-weight: 300;
  color: #2c3e50;
  opacity: 0;
  transform: translateY(40rpx) scale(0.95);
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  letter-spacing: 4rpx;
  padding: 0 4rpx;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
  animation: letterFloat 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  font-family: 'Helvetica Neue', Arial, sans-serif;
}

.text-animation {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.slogan-container {
  text-align: center;
  opacity: 0;
  transform: translateY(30rpx);
  transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
  transition-delay: 0.6s;
  position: relative;
}

.show-slogan {
  opacity: 1;
  transform: translateY(0);
}

.slogan-text {
  font-size: 36rpx;
  color: #34495e;
  letter-spacing: 12rpx;
  font-weight: 300;
  animation: softFloat 4s infinite ease-in-out;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.05);
}

@keyframes floatAndRotate {
  0%, 100% {
    transform: translate(0, 0) rotate(0deg);
  }
  25% {
    transform: translate(20rpx, 20rpx) rotate(2deg);
  }
  50% {
    transform: translate(-20rpx, 40rpx) rotate(-2deg);
  }
  75% {
    transform: translate(-40rpx, -20rpx) rotate(1deg);
  }
}

@keyframes softFloat {
  0%, 100% {
    transform: translateY(0);
    opacity: 1;
  }
  50% {
    transform: translateY(-10rpx);
    opacity: 0.9;
  }
}

@keyframes letterFloat {
  0% {
    opacity: 0;
    transform: translateY(40rpx) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes breathe {
  0%, 100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 0.3;
    transform: scale(1.1);
  }
}

/* 适配暗黑模式 */
@media (prefers-color-scheme: dark) {
  .container {
    background: linear-gradient(135deg, #1a1a1a 0%, #2c2c2c 100%);
  }
  
  .logo-text {
    color: #ffffff;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  }
  
  .slogan-text {
    color: #e0e0e0;
  }

  .circles {
    background: rgba(255, 255, 255, 0.05);
  }

  .light-effect {
    background: radial-gradient(circle at 50% 50%, 
      rgba(255, 255, 255, 0.1) 0%,
      rgba(255, 255, 255, 0.05) 50%,
      rgba(255, 255, 255, 0) 100%);
  }
}
</style>