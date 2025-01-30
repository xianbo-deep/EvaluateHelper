<template>
  <view class="container">
    <!-- 固定顶部 -->
    <view class="header">
      <view class="stats-box">
        <view class="left-box">
          <text class="limit-tip">请选择指标</text>
          <text class="limit-count">({{minSelect}}-{{maxSelect}}个)</text>
        </view>
        <view class="right-box">
          <text class="stats-count">已选：</text>
          <text class="count-num">{{ selectedIndicators.length }}</text>
          <text class="stats-count">/{{maxSelect}}</text>
        </view>
      </view>
    </view>
    
    <!-- 指标列表 -->
    <view class="content">
      <view class="indicator-list">
        <view 
          v-for="indicator in indicators" 
          :key="indicator.id"
          class="indicator-item"
          :class="{
            'indicator-selected': isSelected(indicator),
            'indicator-disabled': !isSelected(indicator) && !canSelect
          }"
          @tap="toggleIndicator(indicator)"
        >
          <view class="indicator-content">
            <text class="indicator-name">{{indicator.name}}</text>
            <text class="indicator-desc">{{indicator.description}}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 确认按钮 -->
    <view class="footer">
      <button 
        class="confirm-btn" 
        :disabled="(selectedIndicators.length < minSelect) || (selectedIndicators.length > maxSelect)"
        @tap="submitMetric"
      >
        确认修改
      </button>
    </view>
  </view>
</template>

<script>
import { store } from '/uni_modules/uni-id-pages/common/store.js';

export default {
  data() {
    return {
      selectedIndicators: [],
      indicators: Array.from({ length: 20 }, (_, index) => ({
        id: index + 1,
        name: `指标${index + 1}`,
        description: `描述${index + 1}`
      })),
      minSelect: 7,
      maxSelect: 9
    }
  },
  computed: {
    canSelect() {
      return this.selectedIndicators.length < this.maxSelect
    }
  },
  onShow() {
	const userId = store.userInfo._id;
    // 尝试从本地缓存获取已选指标
    const cachedMetrics = uni.getStorageSync('${userId}_metricData');
    if (cachedMetrics && cachedMetrics.length > 0) {
      this.selectedIndicators = cachedMetrics;
	  console.log(cachedMetrics);
    } else {
      // 如果没有缓存，设置默认选中指标1-7
      this.selectedIndicators = this.indicators.slice(0, 7);
      // 保存默认选择到本地缓存
      uni.setStorageSync('${userId}_metricData', this.selectedIndicators);
    }
  },
  methods: {
    isSelected(indicator) {
      return this.selectedIndicators.some(i => i.id === indicator.id)
    },
    toggleIndicator(indicator) {
      const index = this.selectedIndicators.findIndex(i => i.id === indicator.id)
      if (index > -1) {
        this.selectedIndicators.splice(index, 1)
      } else {
        this.selectedIndicators.push(indicator)
      }
    },
    submitMetric() {
      // 显示加载提示
      uni.showLoading({
        title: '提交中',
      });
    
      const userId = store.userInfo._id;
      const count = this.selectedIndicators.length;
    
      // 校验选中的指标数量是否符合要求
      if (count < this.minSelect || count > this.maxSelect) {
        uni.showToast({
          title: `请选择${this.minSelect}-${this.maxSelect}个指标`,
          icon: 'none',
        });
    
        // 隐藏加载提示
        uni.hideLoading();
        return;
      }
    
      // 准备提交的数据
      const selectedData = this.selectedIndicators.map(indicator => ({
        id: indicator.id,
        name: indicator.name,
        description: indicator.description,
      }));
    
      const data = {
        userId: userId,
        indicators: selectedData,
        timestamp: Date.now(),
      };
    
      // 调用云函数提交数据
      uniCloud.callFunction({
        name: 'SubmitMetric',
        data: data,
      })
        .then(res => {
          // 判断提交结果
          if (res.result.success) {
            // 成功
            uni.setStorageSync(`${userId}_metricData`, selectedData);
            uni.showToast({
              title: res.result.message,
              icon: 'success',
            });
            uni.switchTab({
              url: '/pages/MyPage/MyPage',
            });
          } else {
            // 失败提示
            uni.showToast({
              title: res.result.message || '提交失败',
              icon: 'none',
            });
          }
        })
        .catch(err => {
          // 捕获错误并提示
          console.error('提交失败：', err);
          uni.showToast({
            title: '系统错误，请稍后重试',
            icon: 'none',
          });
        })
        .finally(() => {
          // 确保隐藏加载提示
          uni.hideLoading();
        });
    }
  }
}
</script>

<style>
.container {
  min-height: 100vh;
  height: 100vh;
  background-color: #f8fafc;
  box-sizing: border-box;
  overflow-y: auto;
  padding-bottom: 120rpx;
}

.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 999;
  background: #ffffff;
  padding: 24rpx 32rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.stats-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
}

.left-box {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.limit-tip {
  font-size: 34rpx;
  color: #1f2937;
  font-weight: 600;
}

.limit-count {
  font-size: 28rpx;
  color: #6b7280;
}

.right-box {
  display: flex;
  align-items: center;
}

.stats-count {
  font-size: 30rpx;
  color: #6b7280;
}

.count-num {
  font-size: 36rpx;
  color: #3b82f6;
  font-weight: 600;
  margin: 0 4rpx;
}

.content {
  padding: 144rpx 32rpx 32rpx;
  min-height: 100vh;
  box-sizing: border-box;
}

.indicator-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
  background: #ffffff;
  padding: 24rpx;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.03);
}

.indicator-item {
  min-height: 160rpx;
  border-radius: 12rpx;
  background: #f9fafb;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  padding: 24rpx;
}

.indicator-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.indicator-name {
  font-size: 32rpx;
  color: #1f2937;
  font-weight: 500;
}

.indicator-desc {
  font-size: 24rpx;
  color: #6b7280;
  line-height: 1.5;
}

.indicator-item::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #000;
  opacity: 0;
  transition: opacity 0.2s;
}

.indicator-item:active::after {
  opacity: 0.05;
}

.indicator-selected {
  background: #ebf5ff;
  border: 2rpx solid #3b82f6;
}

.indicator-selected .indicator-name {
  color: #1d4ed8;
}

.indicator-selected .indicator-desc {
  color: #3b82f6;
}

.indicator-disabled {
  opacity: 0.5;
  background: #f3f4f6;
}

.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx 32rpx;
  background: #ffffff;
  box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.05);
  z-index: 999;
}

.confirm-btn {
  width: 100%;
  height: 88rpx;
  background: #3b82f6;
  color: #ffffff;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.confirm-btn:active {
  opacity: 0.9;
}

.confirm-btn[disabled] {
  background: #94a3b8;
  opacity: 0.7;
  cursor: not-allowed;
}
</style>