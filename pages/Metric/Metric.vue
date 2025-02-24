<template>
  <view class="container">
    <view class="header">
      <view class="header-content">
        <text class="header-title">选择评估套餐</text>
        <text class="header-desc">选择最适合您的评估方案，开启学习之旅</text>
      </view>
    </view>
    
    <view class="content">
      <view class="package-list">
        <view 
          v-for="(pkg, index) in packages" 
          :key="index"
          class="package-item"
          :class="{
            'package-selected': selectedPackage?.package_name === pkg.package_name,
            'package-empty': pkg.status === 'inactive'
          }"
          @tap="selectPackage(pkg)"
        >
          <view class="package-badge" v-if="index === 0">推荐</view>
          <view class="package-content">
            <view class="package-header">
              <text class="package-name">{{pkg.package_name}}</text>
              <text class="package-tag" v-if="index === 0">AI 驱动</text>
            </view>
            <text class="package-description">{{pkg.description || '暂无描述'}}</text>
          </view>
          <view class="select-indicator">
            <view class="select-circle"></view>
          </view>
        </view>
      </view>
    </view>

    <view class="footer safe-area-bottom">
      <button 
        class="confirm-btn"
        :class="{'confirm-btn-active': selectedPackage}"
        :disabled="!selectedPackage"
        @tap="submitSelection"
      >
        <text v-if="!selectedPackage">请选择套餐</text>
        <text v-else>确认选择 {{selectedPackage.package_name}}</text>
      </button>
    </view>
  </view>
</template>

<script>
import { store } from '/uni_modules/uni-id-pages/common/store.js';

export default {
  data() {
    return {
      selectedPackage: null,
      packages: []
    }
  },
  onLoad() {
    this.getPackages()
  },
  methods: {
    selectPackage(pkg) {
      if (pkg.status == 'inactive') return; 
      
      // 如果已经选中，则取消选择
      if (this.selectedPackage?.package_name === pkg.package_name) {
        this.selectedPackage = null;
      } else {
        this.selectedPackage = pkg;
      }
    },
    async getPackages() {
      try {
          uni.showLoading({
           title: '加载中'
         });
		const db = uniCloud.database();
         // 直接查询数据库获取套餐数据 
         const { result } = await db.collection('Package')
           .field('package_id,package_name,description,status')
           
           .get();
      
         if (result.data) {
           this.packages = result.data;
          
          // 获取缓存的选择
          const userId = store.userInfo._id; 
          const cachedSelection = uni.getStorageSync(`${userId}_selectedPackage`);
          
          if (cachedSelection) {
            // 找到对应的套餐并设置为选中
            const selectedPkg = this.packages.find(pkg => 
              pkg.package_id === cachedSelection.package_id && 
              pkg.package_name === cachedSelection.package_name
            );
            if (selectedPkg) {
              this.selectedPackage = selectedPkg;
            }
          }
        } else {
          uni.showToast({
            title: '获取套餐失败',
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('获取套餐失败:', error);
        uni.showToast({
          title: '系统错误，请重试',
          icon: 'none'
        });
      } finally {
        uni.hideLoading();
      }
    },
    async submitSelection() {
      if (!this.selectedPackage) {
        uni.showToast({
          title: '请选择一个套餐',
          icon: 'none'
        });
        return;
      }

      uni.showLoading({
        title: '提交中'
      });

      try {
        const userId = store.userInfo._id;
        const data = {
          userId,
          packageName: this.selectedPackage.package_name,
          packageId: this.selectedPackage.package_id,
          timestamp: Date.now()
        };

        const res = await uniCloud.callFunction({
          name: 'SubmitMetric',
          data
        });

        if (res.result.success) {
          // 只在提交成功后保存选择到缓存
          const cacheData = {
            package_name: this.selectedPackage.package_name,
            package_id: this.selectedPackage.package_id,
			description: this.selectedPackage.description
          };
          uni.setStorageSync(`${userId}_selectedPackage`, cacheData);
          
          uni.showToast({
            title: '选择成功',
            icon: 'success'
          });
          uni.switchTab({
            url: '/pages/MyPage/MyPage'
          });
        } else {
          uni.showToast({
            title: res.result.message || '提交失败',
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('提交失败:', error);
        uni.showToast({
          title: '系统错误，请稍后重试',
          icon: 'none'
        });
      } finally {
        uni.hideLoading();
      }
    }
  }
}
</script>

<style>
.container {
  min-height: 100vh;
  background-color: #f4f6fa;
  box-sizing: border-box;
  padding-bottom: env(safe-area-inset-bottom);
}

.header {
  background: linear-gradient(135deg, #4171f5, #3451b2);
  padding: 48rpx 32rpx;
  padding-bottom: 80rpx;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.header-title {
  font-size: 48rpx;
  color: #ffffff;
  font-weight: 600;
}

.header-desc {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
}

.content {
  margin-top: -40rpx;
  padding: 0 32rpx;
  padding-bottom: 180rpx;
}

.package-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.package-item {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
  border: 2rpx solid transparent;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.package-badge {
  position: absolute;
  top: 24rpx;
  right: -60rpx;
  background: #ff6b6b;
  color: #ffffff;
  padding: 8rpx 80rpx;
  transform: rotate(45deg);
  font-size: 24rpx;
  font-weight: 500;
}

.package-content {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.package-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.package-name {
  font-size: 36rpx;
  color: #1a1a1a;
  font-weight: 600;
}

.package-tag {
  background: rgba(65, 113, 245, 0.1);
  color: #4171f5;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
  font-weight: 500;
}

.package-description {
  font-size: 28rpx;
  color: #666666;
  line-height: 1.6;
}

.select-indicator {
  position: absolute;
  right: 32rpx;
  top: 50%;
  transform: translateY(-50%);
}

.select-circle {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  border: 3rpx solid #ddd;
  transition: all 0.3s ease;
}

.package-selected {
  border-color: #4171f5;
  background: #f8faff;
  transform: translateY(-2rpx);
  box-shadow: 0 8rpx 24rpx rgba(65, 113, 245, 0.1);
}

.package-selected .package-name {
  color: #4171f5;
}

.package-selected .select-circle {
  border-color: #4171f5;
  background: #4171f5;
  position: relative;
}

.package-selected .select-circle::after {
  content: '';
  position: absolute;
  width: 20rpx;
  height: 12rpx;
  border: 3rpx solid #fff;
  border-top: none;
  border-right: none;
  transform: rotate(-45deg);
  top: 10rpx;
  left: 8rpx;
}

.package-empty {
  opacity: 0.5;
  cursor: not-allowed;
}

.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx 32rpx;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.confirm-btn {
  width: 100%;
  height: 88rpx;
  background: #e5e7eb;
  color: #666666;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  transition: all 0.3s ease;
}

.confirm-btn-active {
  background: linear-gradient(135deg, #4171f5, #3451b2);
  color: #ffffff;
}

.confirm-btn-active:active {
  transform: scale(0.98);
  opacity: 0.9;
}
</style>