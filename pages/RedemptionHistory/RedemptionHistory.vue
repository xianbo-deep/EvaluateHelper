<template>
  <view class="container">
    <template v-if="loading">
      <view class="loading-container">
        <uni-load-more status="loading" />
      </view>
    </template>
    
    <template v-else>
      <!-- 没有记录时显示 -->
      <view v-if="records.length === 0" class="empty-state">
        <uni-icons type="info" size="64" color="#999"></uni-icons>
        <text class="empty-text">暂无兑换记录</text>
      </view>
      
      <!-- 记录列表 -->
      <view v-else class="records-list">
        <view 
          v-for="record in records" 
          :key="record._id" 
          class="record-item"
        >
          <view class="record-header">
            <view class="card-type-tag" :class="record.cardType">
              {{ getCardTypeText(record.cardType) }}
            </view>
            <text class="time">{{ formatTime(record.redeemTime) }}</text>
          </view>
          
          <view class="record-content">
            <view class="info-row">
              <text class="label">卡号：</text>
              <text class="value">{{ record.cardId }}</text>
            </view>
            <view class="info-row">
              <text class="label">面值：</text>
              <text class="value">{{ formatValue(record.cardType, record.cardValue) }}</text>
            </view>
          </view>
        </view>
      </view>
    </template>
  </view>
</template>

<script>
import { store } from '/uni_modules/uni-id-pages/common/store.js'

export default {
  data() {
    return {
      loading: true,
      records: []
    }
  },
  
  onLoad() {
    this.loadRecords()
  },
  
  // 下拉刷新
  onPullDownRefresh() {
    this.loadRecords().then(() => {
      uni.stopPullDownRefresh()
    })
  },
  
  methods: {
    async loadRecords() {
      this.loading = true
      try {
        const res = await uniCloud.callFunction({
          name: 'getExchangeRecords',
          data: {
            userId: store.userInfo._id
          }
        })
        
        if (res.result.code === 0) {
          this.records = res.result.data
        } else {
          uni.showToast({
            title: res.result.message || '加载失败',
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('加载记录失败:', error)
        uni.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },
    
    getCardTypeText(type) {
      const types = {
        'times': '次卡',
        'daily': '日卡',
        'monthly': '月卡'
      }
      return types[type] || '未知'
    },
    
    formatValue(type, value) {
      switch (type) {
        case 'times':
          return `${value}次`
        case 'daily':
          return `${value}天`
        case 'monthly':
          return `${value}天`  // 月卡也显示天数
        default:
          return value
      }
    },
    
    formatTime(timestamp) {
      const date = new Date(timestamp)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    }
  }
}
</script>

<style lang="scss">
.container {
  padding: 20rpx;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
  
  .empty-text {
    margin-top: 20rpx;
    color: #999;
    font-size: 28rpx;
  }
}

.records-list {
  .record-item {
    background-color: #fff;
    border-radius: 12rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;
    box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
    
    .record-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16rpx;
      
      .card-type-tag {
        padding: 4rpx 16rpx;
        border-radius: 6rpx;
        font-size: 24rpx;
        
        &.times {
          background-color: #e6f3ff;
          color: #2196f3;
        }
        
        &.daily {
          background-color: #e8f5e9;
          color: #4caf50;
        }
        
        &.monthly {
          background-color: #fff3e0;
          color: #ff9800;
        }
      }
      
      .time {
        font-size: 24rpx;
        color: #999;
      }
    }
    
    .record-content {
      .info-row {
        display: flex;
        margin-bottom: 8rpx;
        
        .label {
          color: #666;
          width: 100rpx;
          font-size: 28rpx;
        }
        
        .value {
          flex: 1;
          color: #333;
          font-size: 28rpx;
        }
      }
    }
  }
}
</style>