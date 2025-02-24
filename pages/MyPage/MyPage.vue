<template>
  <view class="profile-container">
    <!-- 加载状态显示 -->
    <view v-if="isLoading" class="loading-container">
      <text class="loading-text">加载中...</text>
    </view>
    
    <!-- 页面内容 -->
    <view v-else>
      <view class="cover-image">
        <view class="cover-pattern"></view>
      </view>
      
      <view class="profile-card">
        <view :class="['info-container', {'guest-container': !store.hasLogin}]">
          <view class="avatar-container" @tap="viewavatar">
            <image
              :src="avatar || '/static/default-avatar.png'"
              mode="aspectFill"
              class="avatar-image"
              @error="onAvatarError">
            </image>
          </view>

          <view class="user-info">
            <text class="nickname">{{ store.hasLogin ? nickname : '未登录' }}</text>
            <text v-if="store.hasLogin" class="member-badge" :class="memberStatusClass">
              {{ getMemberStatusText() }}
            </text>
          </view>

          <view v-if="!store.hasLogin" class="login-section">
            <button class="login-btn" @tap="handleLogin">立即登录</button>
          </view>
        </view>

        <view v-if="store.hasLogin" class="menu-section">
          <view class="menu-item" @tap="handleActivateCard">
            <view class="menu-item-left">
              <text class="menu-text">兑换卡密</text>
            </view>
            <text class="menu-arrow">></text>
          </view>
		  <view class="menu-item" @tap="handleHelp">
		    <text class="menu-text">兑换记录</text>
		    <text class="menu-arrow">></text>
		  </view>
		  <view class="menu-item" @tap="handleMetrics">
		    <text class="menu-text">套餐设置</text>
		    <text class="menu-arrow">></text>
		  </view>
          <view class="menu-item" @tap="handleEdit">
            <text class="menu-text">个人信息</text>
            <text class="menu-arrow">></text>
          </view>
          
          <view class="menu-item" @tap="handleFeedback">
            <text class="menu-text">意见反馈</text>
            <text class="menu-arrow">></text>
          </view>
          
        </view>

        <view v-if="store.hasLogin" class="logout-section">
          <button class="logout-btn" @tap="handleLogout">注销账号</button>
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
      nickname: '加载中...',
      avatar: '',
      isLoading: true,
      memberInfo: {
        memberStatus: 'none', // 会员状态：none-非会员，active-有效会员
        membertype: 'none',   // 会员类型：none-非会员，daily-日卡，monthly-月卡，times-次卡
        usedTrial: false ,    // 是否已使用过试用
		remainingTimes: 0
      }
    }
  },
  computed: {
    store() {
      return store;
    },
    memberStatusClass() {
      const { memberStatus, membertype } = this.memberInfo;
      if (memberStatus !== 'active') return 'status-normal';
      
      switch(membertype) {
        case 'daily':
          return 'status-daily';
        case 'monthly':
          return 'status-monthly';
        case 'times':
          return 'status-times';
        default:
          return 'status-normal';
      }
    }
  },
  onShow() {
    if (store.hasLogin) {
      this.loadUserData();
    }
  },
  
  async onLoad() {
    this.isLoading = true;
    if (store.hasLogin) {
      await this.loadUserData();
    } else {
      this.nickname = '未登录';
      this.isLoading = false;
    }
  },

  methods: {
    // 加载用户数据
    async loadUserData() {
      this.isLoading = true;
      const userId = store.userInfo._id;
      
      try {
        const db = uniCloud.database();
        
        // 查询用户信息
        const result = await db.collection('User')
          .where({userId})
          .field({
            'nickname': true,
            'avatarUrl': true,
            'email': true,
            'bio': true,
            'phone': true,
            'status': true,
            'memberStatus': true,
            'membertype': true,
            'remainingTimes': true,
            'remainingDays': true,
            'usedTrial': true,
            'memberExpireTime': true
          })
          .get();
        const userData = result.result.data[0];
        if (userData) {
          // 更新组件数据
          this.nickname = userData.nickname;
          this.avatar = userData.avatarUrl;
          this.memberInfo = {
            memberStatus: userData.memberStatus || 'none',
            membertype: userData.membertype || 'none',
            remainingTimes: userData.remainingTimes || 0,
            remainingDays: userData.remainingDays || 0,
            usedTrial: userData.usedTrial || false
          };
    
          const userdata = {
            nickname: userData.nickname,
            email: userData.email,
            bio: userData.bio || '',
            phone: userData.phone,
            status: userData.status
          };
    
          // 更新本地缓存
          uni.setStorageSync(`${userId}_memberInfo`, this.memberInfo);
          uni.setStorageSync(`${userId}_nickname`, this.nickname);
          uni.setStorageSync(`${userId}_avatar`, this.avatar);
          uni.setStorageSync(`${userId}_userdata`, userdata);
    
          // 检查会员状态是否过期
          if (userData.memberStatus === 'active' && userData.memberExpireTime) {
            const now = new Date();
            const expireTime = new Date(userData.memberExpireTime);
            if (now > expireTime) {
              // 会员已过期，更新状态
              await db.collection('users')
                .doc(userId)
                .update({
                  memberStatus: 'expired'
                });
              this.memberInfo.memberStatus = 'expired';
              uni.setStorageSync(`${userId}_memberInfo`, this.memberInfo);
            }
          }
        } else {
          throw new Error('未找到用户数据');
        }
      } catch (err) {
        console.error('加载用户数据失败:', err);
        uni.showToast({
          title: '加载用户数据失败',
          icon: 'none'
        });
      } finally {
        this.isLoading = false;
      }
    },
    // 获取会员状态文本
    getMemberStatusText() {
      const { memberStatus, membertype, remainingDays, remainingTimes } = this.memberInfo;
      if (memberStatus !== 'active') return '普通用户';
      
      switch(membertype) {
        case 'daily':
          return '日卡会员';
        case 'monthly':
          return '月卡会员';
        case 'times':
          return `次卡会员(${remainingTimes}次)`;
        default:
          return '试用会员';
      }
    },

    // 格式化过期时间
    formatExpireTime(timestamp) {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      return `${date.getMonth() + 1}月${date.getDate()}日`;
    },

    // 处理兑换卡密
    handleActivateCard() {
      uni.navigateTo({
        url: '/pages/Card/Card',
      });
    },

    handleLogin() {
      uni.navigateTo({
        url: '/uni_modules/uni-id-pages/pages/login/login-withoutpwd?type=univerify',
      });
    },

    onAvatarError() {
      this.avatar = '/static/default-avatar.png';
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
        url: '/pages/RedemptionHistory/RedemptionHistory',
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
            const userId = store.userInfo._id;
            const tempNickname = this.nickname;
            const tempUserdata = uni.getStorageSync(`${userId}_userdata`);
            const tempmetrcidata = uni.getStorageSync(`${userId}_metricData`);
            const tempavatar = uni.getStorageSync(`${userId}_avatar`);
            this.nickname = '';
			this.avatar = '';
            // 清除所有缓存
            uni.clearStorage({
              success: () => {
                // 重新存储保留的数据
                uni.setStorageSync(`${userId}_nickname`, tempNickname);
                uni.setStorageSync(`${userId}_userdata`, tempUserdata);
                uni.setStorageSync(`${userId}_metricData`, tempmetrcidata);
                uni.setStorageSync(`${userId}_avatar`, tempavatar);
                
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
  align-items: center;
  justify-content: center;
  border: 6rpx solid #ffffff;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.12);
}

.loading-spinner {
  font-size: 24rpx;
  color: #666;
  animation: fadeInOut 1.5s infinite;
}

@keyframes fadeInOut {
  0% { opacity: 0.3; }
  50% { opacity: 1; }
  100% { opacity: 0.3; }
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

.member-badge {
  font-size: 24rpx;
  padding: 4rpx 16rpx;
  border-radius: 24rpx;
  margin-top: 8rpx;
  display: inline-block;
}

.status-normal {
  background: #f0f0f0;
  color: #666;
}

.status-daily {
  background: #e6f7ff;
  color: #3494E6;
}

.status-monthly {
  background: #fff7e6;
  color: #fa8c16;
}

.status-times {
  background: #f6ffed;
  color: #52c41a;
}

.expire-time {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
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

.menu-item-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
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

.loading-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fff;
  z-index: 999;
}

.loading-text {
  font-size: 16px;
  color: #666;
}
</style>