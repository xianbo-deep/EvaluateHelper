`<template>
  <view class="plaza-container">
    <!-- 顶部轮播区域 -->
    <view class="banner-section">
      <!-- 轮播图 -->
      <swiper class="banner-swiper" 
              circular 
              autoplay 
              interval="3000" 
              duration="500"
              indicator-dots
              indicator-active-color="#ffffff">
        <swiper-item v-for="(banner, index) in banners" :key="index">
          <image class="banner-image" :src="banner.imageUrl" mode="aspectFill"></image>
          <view class="banner-text">{{banner.text}}</view>
        </swiper-item>
      </swiper>
      
      <!-- 滚动公告栏 -->
      <view class="announcement-bar">
        <view class="announcement-icon">📢</view>
        <swiper class="announcement-swiper" 
                vertical 
                circular 
                autoplay 
                interval="3000" 
                duration="500">
          <swiper-item v-for="(notice, index) in announcements" :key="index">
            <view class="announcement-text">{{notice}}</view>
          </swiper-item>
        </swiper>
      </view>
    </view>

    <!-- 主播展示区 -->
    <view class="host-section">
      <view class="section-title">
        <text class="title-text">推荐主播</text>
        <text class="see-more" @tap="showAllHosts">查看更多 ></text>
      </view>
      <view class="host-grid">
        <view class="host-item" 
              v-for="(host, index) in hosts" 
              :key="index"
              @tap="goToHostDetail(host.userId)">
          <image class="host-avatar" :src="host.avatarUrl" mode="aspectFill"></image>
          <view class="host-status" :class="{'online': host.isOnline}">
            {{ host.isOnline ? '直播中' : '休息中' }}
          </view>
          <view class="host-info">
            <text class="host-name">{{host.nickname}}</text>
            <view class="host-stats">
              <text class="fans-count">{{host.fansCount}}粉丝</text>
              <text class="rating">评分：{{host.rating}}分</text>
            </view>
            <view class="host-tags">
              <text class="tag" 
                    v-for="(tag, tagIndex) in host.tags" 
                    :key="tagIndex">{{tag}}</text>
            </view>
          </view>
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
      banners: [
        {
          imageUrl: '/static/banner1.jpg',
          text: '加入我们，实现主播梦想'
        },
        {
          imageUrl: '/static/banner2.jpg',
          text: '新人主播福利计划'
        },
        {
          imageUrl: '/static/banner3.jpg',
          text: '优秀主播培训计划'
        }
      ],
      announcements: [
        '🎯 诚聘主播：坐班时间自由，收入稳定，有意者请联系招聘专员',
        '💰 新人主播福利：入驻即送价值3000元礼包',
        '📚 主播培训计划开启：专业团队指导，快速上手'
      ],
      hosts: [
        {
          userId: '1',
          nickname: '小美',
          avatarUrl: '/static/host1.jpg',
          isOnline: true,
          fansCount: '2.8万',
          rating: '4.9',
          tags: ['情感', '脱单']
        },
        {
          userId: '2',
          nickname: '阿杰',
          avatarUrl: '/static/host2.jpg',
          isOnline: false,
          fansCount: '1.5万',
          rating: '4.8',
          tags: ['情感', '职场']
        },
        {
          userId: '3',
          nickname: '知心姐姐',
          avatarUrl: '/static/host3.jpg',
          isOnline: true,
          fansCount: '3.2万',
          rating: '4.9',
          tags: ['情感', '心理']
        },
        {
          userId: '4',
          nickname: '老王',
          avatarUrl: '/static/host4.jpg',
          isOnline: false,
          fansCount: '1.7万',
          rating: '4.7',
          tags: ['情感', '婚恋']
        }
      ]
    }
  },
  onShow(){
	if(!store.hasLogin){
		uni.showToast({
			title: '请先登录',
			icon:'none'
		})
		uni.switchTab({
			url:'/pages/MyPage/MyPage'
		})
	}
	const userId = store.userInfo._id;
	const memberInfo = uni.getStorageSync(`${userId}_memberInfo`);
	if(memberInfo.cardCategory === 'review' || memberInfo.cardCategory === 'tutorial'){
		uni.showToast({
			title: '您购买的卡密没有权限进入该页面',
			icon:'none'
		})
		uni.switchTab({
			url:'/pages/MyPage/MyPage'
		})
		return ;
	}  
  },
  methods: {
    goToHostDetail(userId) {
      uni.navigateTo({
        url: `/pages/host/detail?id=${userId}`
      });
    },
    showAllHosts() {
      uni.navigateTo({
        url: '/pages/host/list'
      });
    }
  }
}
</script>

<style>
.plaza-container {
  flex: 1;
  background-color: #f5f5f5;
  min-height: 100vh;
}

/* 轮播区域样式 */
.banner-section {
  background: linear-gradient(to right, #FF6B6B, #556270);
  padding-bottom: 30rpx;
}

.banner-swiper {
  width: 100%;
  height: 400rpx;
}

.banner-image {
  width: 100%;
  height: 100%;
}

.banner-text {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx;
  color: #ffffff;
  font-size: 32rpx;
  font-weight: bold;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
}

/* 公告栏样式 */
.announcement-bar {
  margin: 20rpx 30rpx 0;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 16rpx;
  padding: 20rpx;
  display: flex;
  align-items: center;
}

.announcement-icon {
  font-size: 36rpx;
  margin-right: 20rpx;
}

.announcement-swiper {
  flex: 1;
  height: 60rpx;
}

.announcement-text {
  font-size: 28rpx;
  color: #333;
  line-height: 60rpx;
}

/* 主播展示区样式 */
.host-section {
  margin: 20rpx;
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 30rpx;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.title-text {
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
}

.see-more {
  font-size: 26rpx;
  color: #666;
}

.host-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  padding: 10rpx;
}

.host-item {
  background-color: #ffffff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
  position: relative;
  padding: 20rpx;
}

.host-avatar {
  width: 140rpx;
  height: 140rpx;
  border-radius: 70rpx;
  margin: 0 auto 20rpx;
  display: block;
  border: 4rpx solid #ffffff;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.host-status {
  position: absolute;
  top: 20rpx;
  right: 20rpx;
  font-size: 24rpx;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  background-color: #999999;
  color: #ffffff;
}

.host-status.online {
  background-color: #00b578;
}

.host-info {
  text-align: center;
}

.host-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
}

.host-stats {
  display: flex;
  justify-content: center;
  font-size: 24rpx;
  color: #666;
  margin-bottom: 16rpx;
}

.fans-count {
  margin-right: 20rpx;
}

.host-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10rpx;
}

.tag {
  font-size: 22rpx;
  color: #ff6b6b;
  background-color: #fff1f0;
  padding: 4rpx 16rpx;
  border-radius: 12rpx;
}
</style>`