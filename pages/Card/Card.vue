<template>
  <view class="container">
	   <template v-if="pageLoading">
		<view class="loading-container">
		  <uni-load-more status="loading" />
		</view>
	  </template>
    <!-- 卡密信息卡片 -->
	 <template v-else>
    <view class="card-info">
      <view class="member-status">
        <text class="status-label">当前状态：</text>
        <text :class="['status-value', {'active': memberInfo.memberStatus === 'active'}]">
          {{ getMemberStatusText() }}
        </text>
      </view>
      <view v-if="memberInfo.memberStatus === 'active'" class="expire-info">
        <!-- 日卡和月卡显示到期时间和剩余天数 -->
        <template v-if="['daily', 'monthly'].includes(memberInfo.membertype)">
          <view>
            <text class="expire-label">到期时间：</text>
            <text class="expire-value">{{ formatExpireTime(memberInfo.memberExpireTime) }}</text>
          </view>
          <view>
            <text class="days-label">剩余天数：</text>
            <text class="days-value">{{ memberInfo.remainingDays }}天</text>
          </view>
        </template>
        <!-- 次卡显示剩余次数 -->
        <template v-else-if="memberInfo.membertype === 'times'">
          <view class="times-info">
            <text class="times-label">剩余次数：</text>
            <text class="times-value">{{ memberInfo.remainingTimes || 0 }}次</text>
          </view>
        </template>
      </view>
    </view>

    <!-- 免费体验提示 -->
    <view v-if="!memberInfo.usedTrial" class="free-trial-tip">
      <uni-icons type="info" size="16" color="#3494E6"></uni-icons>
      <text>您有一次免费体验机会</text>
      <button class="trial-btn" @tap="handleFreeTrial">立即体验</button>
    </view>

    <!-- 卡密输入区域 -->
    <view class="input-section">
      <view class="input-group">
        <text class="input-label">卡号</text>
        <input 
          class="input-field"
          type="text"
          v-model="cardNumber"
          placeholder="请输入卡号"
          @input="onInputChange"
        />
      </view>
      <view class="input-group">
        <text class="input-label">卡密</text>
        <input 
          class="input-field"
          type="text"
          v-model="cardPassword"
          placeholder="请输入卡密"
          @input="onInputChange"
        />
      </view>
    </view>

    <!-- 激活按钮 -->
    <button 
      class="activate-btn" 
      :disabled="!isValid || loading"
      @tap="handleActivate"
    >
      {{ loading ? '激活中...' : '立即激活' }}
    </button>

    <!-- 使用说明 -->
    <view class="instructions">
      <view class="instruction-title">使用说明</view>
      <view class="instruction-item">1. 请确保输入的卡号和卡密正确</view>
      <view class="instruction-item">2. 卡密激活后即时生效</view>
      <view class="instruction-item">3. 当前会员未过期时激活新卡密，有效期将自动叠加(次卡与日卡月卡不可叠加)</view>
      <view class="instruction-item">4. 如遇到问题请提交反馈</view>
    </view>
	</template>
  </view>
</template>

<script>
import { store } from '/uni_modules/uni-id-pages/common/store.js'

export default {
  data() {
    return {
      cardNumber: '',
      cardPassword: '',
	  pageLoading: true, // 添加页面加载状态
      loading: false,
      memberInfo: {
        memberStatus: 'none', // 会员状态：none-非会员，active-有效会员
        membertype: 'none',   // 会员类型：none-非会员，daily-日卡，monthly-月卡，times-次卡
        remainingTimes: 0,    // 剩余次数（次卡用）
        remainingDays: 0,     // 剩余天数（日卡/月卡用）
        usedTrial: false,     // 是否已使用过试用
        memberExpireTime: '', // 会员到期时间
      },
      isValid: false
    }
  },

  onLoad() {
    this.loadMemberInfo()
	
  },

  methods: {
    // 加载会员信息
    async loadMemberInfo() {
      if (!store.hasLogin) return;
      
      try {
        const res = await uniCloud.callFunction({
          name: 'getMemberInfo',
          data: {
            userId: store.userInfo._id
          }
        });
        
        if (res.result.code === 0) {
          // 如果是日卡或月卡，计算剩余天数
          if (['daily', 'monthly'].includes(res.result.data.membertype) && res.result.data.memberExpireTime) {
            const now = new Date().getTime();
            const expireTime = new Date(res.result.data.memberExpireTime).getTime();
            const remainingDays = Math.ceil((expireTime - now) / (1000 * 60 * 60 * 24));
            res.result.data.remainingDays = Math.max(0, remainingDays);
          }
          
          this.memberInfo = res.result.data;
        }
		console.log(res.result.data)
      } catch (error) {
        console.error('加载会员信息失败:', error);
        uni.showToast({
          title: '加载会员信息失败',
          icon: 'none'
        });
      }finally{
		  this.pageLoading = false
	  }
    },

    // 处理输入变化
    onInputChange() {
      this.isValid = this.cardNumber.length > 0 && this.cardPassword.length > 0;
    },

    // 处理卡密激活
    async handleActivate() {
      if (!this.isValid || this.loading) return;
      const userId = store.userInfo._id;
      this.loading = true;
      try {
        const { result } = await uniCloud.callFunction({
          name: 'activateCard',
          data: {
            userId: store.userInfo._id,
            cardNumber: this.cardNumber,
            cardPassword: this.cardPassword
          }
        });
		
        if (result.code === 0) {
          uni.showToast({
            title: '激活成功',
            icon: 'success'
          });
          // 重新加载会员信息
          await this.loadMemberInfo();
		  const memberData={
			  memberStatus: this.memberInfo.memberStatus || 'none',
			  membertype: this.memberInfo.membertype || 'none',
			  usedTrial: this.memberInfo.usedTrial || false,
			  remainingTimes: this.memberInfo.remainingTimes || 0
		  }
		  uni.setStorageSync(`${userId}_memberInfo`, memberData);
          // 清空输入
          this.cardNumber = '';
          this.cardPassword = '';
          this.isValid = false;
        } else {
          uni.showToast({
            title: result.message || '激活失败',
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('激活失败:', error);
        uni.showToast({
          title: '激活失败，请重试',
          icon: 'none'
        });
      } finally {
        this.loading = false;
      }
    },

    // 处理免费体验
    async handleFreeTrial() {
      if (this.loading) return;
      
      this.loading = true;
      try {
        const { result } = await uniCloud.callFunction({
          name: 'activateFreeTrial',
          data: {
            userId: store.userInfo._id
          }
        });

        if (result.code === 0) {
          uni.showToast({
            title: '免费体验已激活',
            icon: 'success'
          });
          await this.loadMemberInfo();
        } else {
          uni.showToast({
            title: result.message || '激活失败',
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('激活免费体验失败:', error);
        uni.showToast({
          title: '激活失败，请重试',
          icon: 'none'
        });
      } finally {
        this.loading = false;
      }
    },

    // 获取会员状态文本
    getMemberStatusText() {
      const { memberStatus, membertype } = this.memberInfo;
      if (memberStatus === 'active') {
        switch (membertype) {
          case 'daily':
            return '日卡会员';
          case 'monthly':
            return '月卡会员';
          case 'times':
            return '次卡会员';
          default:
            return '试用会员';
        }
      }
      return '普通用户';
    },

    // 格式化过期时间
    formatExpireTime(timestamp) {
      if (!timestamp) return '未知';
      const date = new Date(timestamp);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
  }
}
</script>

<style>
.container {
  padding: 32rpx;
  background-color: #f8fafc;
  min-height: 100vh;
}

.card-info {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.member-status {
  margin-bottom: 16rpx;
}

.status-label, .expire-label, .times-label {
  color: #666;
  font-size: 28rpx;
}

.status-value {
  color: #333;
  font-size: 28rpx;
  font-weight: 500;
}

.status-value.active {
  color: #3494E6;
}

.expire-info, .times-info {
  font-size: 28rpx;
  margin-top: 12rpx;
}

.free-trial-tip {
  background: rgba(52, 148, 230, 0.1);
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 32rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.trial-btn {
  margin-left: auto;
  font-size: 24rpx;
  padding: 8rpx 24rpx;
  background: #3494E6;
  color: #fff;
  border-radius: 24rpx;
  border: none;
}

.input-section {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.input-group {
  margin-bottom: 24rpx;
}

.input-group:last-child {
  margin-bottom: 0;
}

.input-label {
  display: block;
  font-size: 28rpx;
  color: #666;
  margin-bottom: 12rpx;
}

.input-field {
  width: 100%;
  height: 88rpx;
  border: 2rpx solid #e5e7eb;
  border-radius: 8rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.activate-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #3494E6, #EC6EAD);
  color: #ffffff;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 500;
  margin: 48rpx 0;
  border: none;
}

.activate-btn[disabled] {
  background: #cccccc;
  color: #ffffff;
}

.instructions {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.instruction-title {
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 24rpx;
}

.instruction-item {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 16rpx;
  line-height: 1.5;
}

.instruction-item:last-child {
  margin-bottom: 0;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
</style>