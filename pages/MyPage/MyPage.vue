<template>
  <view class="profile-container">
    <view class="cover-image">
      <view class="cover-pattern"></view>
    </view>
    
    <view class="profile-card">
      <view :class="['info-container', {'guest-container': !store.hasLogin}]">
        <view class="avatar-container" @tap="viewavatar">
          <view v-if="isLoading" class="avatar-loading">
            <text class="loading-spinner">加载中...</text>
          </view>
          <image
            v-else
            :src="avatar || '/static/default-avatar.png'"
            mode="aspectFill"
            class="avatar-image"
            @error="onAvatarError">
          </image>
        </view>

        <view class="user-info">
          <text class="nickname">{{ store.hasLogin ? nickname : '未登录' }}</text>
        </view>

        <view v-if="!store.hasLogin" class="login-section">
          <button class="login-btn" @tap="handleLogin">立即登录</button>
        </view>
      </view>

      <view v-if="store.hasLogin" class="menu-section">
        <view class="menu-item" @tap="handleEdit">
          <text class="menu-text">个人信息</text>
          <text class="menu-arrow">></text>
        </view>
        <view class="menu-item" @tap="handleMetrics">
          <text class="menu-text">指标设置</text>
          <text class="menu-arrow">></text>
        </view>
        <view class="menu-item" @tap="handleFeedback">
          <text class="menu-text">意见反馈</text>
          <text class="menu-arrow">></text>
        </view>
        <view class="menu-item" @tap="handleHelp">
          <text class="menu-text">帮助中心</text>
          <text class="menu-arrow">></text>
        </view>
      </view>

      <view v-if="store.hasLogin" class="logout-section">
        <button class="logout-btn" @tap="handleLogout">注销账号</button>
      </view>
    </view>
  </view>
</template>

<script>
import { store } from '/uni_modules/uni-id-pages/common/store.js';

export default {
  data() {
    return {
      nickname: '加载中...',
      avatar: '',
      isLoading: true
    }
  },
  computed: {
    store() {
      return store;
    },
  },
  onShow() {
    const userId = store.userInfo._id;
    if (store.hasLogin) {
      const cachedNickname = uni.getStorageSync('${userId}_nickname');
      const cachedAvatar = uni.getStorageSync('${userId}_avatar');
      if (cachedAvatar) {
        this.avatar = cachedAvatar;
        this.isLoading = false;
      }
      if (cachedNickname) {
        this.nickname = cachedNickname;
      } else {
        this.nickname = '未设置昵称';
      }
    }
  },
  
  async onLoad() {
    this.isLoading = true;
    const userId = store.userInfo._id;
    if (store.hasLogin) {
      const cachedNickname = uni.getStorageSync('${userId}_nickname');
      const cachedAvatar = uni.getStorageSync('${userId}_avatar');
      if (cachedNickname || cachedAvatar) {
        this.nickname = cachedNickname;
        this.avatar = cachedAvatar;
        this.isLoading = false;
      } else {
        try {
          const res = await uniCloud.callFunction({
            name: 'Getuser',
            data: {
              uid: store.userInfo._id,
            },
          });

          if (res.result && res.result.code === 0) {
            this.nickname = res.result.data.nickname;
            this.avatar = res.result.data.avatarUrl;
            uni.setStorageSync('${userId}_nickname', this.nickname);
            uni.setStorageSync('${userId}_avatar', this.avatar);
          } else {
            this.nickname = '未设置昵称';
          }
        } catch (err) {
          console.error('云函数调用失败:', err);
          this.nickname = '加载失败';
        } finally {
          this.isLoading = false;
        }
      }
    } else {
      console.log('用户未登录');
      this.nickname = '未登录';
      this.isLoading = false;
    }
  },

  methods: {
    handleLogin() {
      uni.navigateTo({
        url: '/uni_modules/uni-id-pages/pages/login/login-withpwd',
      });
    },
    onAvatarError() {
      store.userInfo.avatar = '/static/default-avatar.png';
    },
    handleEdit() {
      uni.navigateTo({
        url: '/pages/UserData/UserData',
      });
    },
    handleMetrics() {
      uni.navigateTo({
        url: '/pages/Metric/Metric',
      });
    },
    handleFeedback() {
      uni.navigateTo({
        url: '/pages/Feedback/Feedback',
      });
    },
    handleHelp() {
      uni.navigateTo({
        url: '/pages/help-center/help-center',
      });
    },
    handleLogout() {
      uni.showModal({
        title: '确认注销',
        content: '确定要注销账号吗？',
        success: (res) => {
          if (res.confirm) {
            store.hasLogin = false;
            store.userInfo = {};
    
            // 缓存需要保留的数据
            const tempNickname = this.nickname;
            const tempUserdata = uni.getStorageSync('${userId}_userdata');
            const tempmetrcidata = uni.getStorageSync('${userId}_metricData');
            const tempavatar = uni.getStorageSync('${userId}_avatar');
            
            // 清除所有缓存
            uni.clearStorage({
              success: () => {
                // 重新存储保留的数据
                uni.setStorageSync('${userId}_nickname', tempNickname);
                uni.setStorageSync('${userId}_userdata', tempUserdata);
                uni.setStorageSync('${userId}_metricData', tempmetrcidata);
                uni.setStorageSync('${userId}_avatar', tempavatar);
                
                uni.showToast({
                  title: '已注销账号',
                  icon: 'none',
                });
    
                uni.switchTab({
                  url: '/pages/MyPage/MyPage'
                });
              },
              fail: (err) => {
                console.error('清除本地缓存失败:', err);
                uni.showToast({
                  title: '注销失败，请稍后重试',
                  icon: 'none',
                });
              },
            });
          }
        },
      });
    },

    viewavatar() {
      if (!this.avatar) {
        uni.showToast({
          title: '暂无头像',
          icon: 'none',
        });
        return;
      }
      uni.previewImage({
        current: this.avatar,
        urls: [this.avatar],
        success: () => {
          console.log('图片预览成功');
        },
        fail: (err) => {
          console.error('图片预览失败:', err);
        },
      });
    }
  }
}
</script>

<style>
.profile-container {
  min-height: 100vh;
  background-color: #f8fafc;
}

.cover-image {
  height: 240rpx;
  background: linear-gradient(135deg, #3494E6, #EC6EAD);
  position: relative;
  overflow: hidden;
}

.cover-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 100%);
}

.cover-image::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  background: linear-gradient(to bottom, transparent, rgba(248, 250, 252, 0.8));
}

.profile-card {
  margin: -120rpx 32rpx 32rpx;
  padding: 0;
  background-color: transparent;
}

.info-container {
  background: #ffffff;
  border-radius: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.guest-container {
  padding-bottom: 40rpx;
}

.avatar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 32rpx 24rpx;
  position: relative;
}

.avatar-image {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  border: 6rpx solid #ffffff;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.12);
  position: relative;
  z-index: 1;
}

.avatar-loading {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 6rpx solid #ffffff;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.12);
}

.loading-spinner {
  font-size: 24rpx;
  color: #666;
  text-align: center;
  animation: fadeInOut 1.5s infinite;
}

@keyframes fadeInOut {
  0% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.3;
  }
}

.user-info {
  text-align: center;
  padding: 0 32rpx;
  margin-bottom: 24rpx;
}

.nickname {
  font-size: 36rpx;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8rpx;
  display: block;
}

.login-section {
  padding: 0 48rpx;
  margin-top: 32rpx;
}

.login-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  background: linear-gradient(135deg, #3494E6, #EC6EAD);
  color: #ffffff;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 500;
  border: none;
  box-shadow: 0 8rpx 24rpx rgba(52, 148, 230, 0.2);
  transition: all 0.3s ease;
}

.login-btn:active {
  transform: translateY(2rpx);
  box-shadow: 0 4rpx 12rpx rgba(52, 148, 230, 0.2);
}

.menu-section {
  margin-top: 24rpx;
  background: #ffffff;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-text {
  font-size: 30rpx;
  color: #333333;
  font-weight: 500;
}

.menu-arrow {
  font-size: 30rpx;
  color: #999999;
}

.menu-item:active {
  background-color: #f8fafc;
}

.logout-section {
  margin-top: 48rpx;
  padding: 0 32rpx;
}

.logout-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  background-color: #ffffff;
  color: #ff4444;
  border-radius: 44rpx;
  font-size: 30rpx;
  font-weight: 500;
  border: 2rpx solid #ff4444;
  transition: all 0.3s ease;
  box-shadow: 0 4rpx 12rpx rgba(255, 68, 68, 0.1);
}

.logout-btn:active {
  background-color: rgba(255, 68, 68, 0.05);
}
</style>