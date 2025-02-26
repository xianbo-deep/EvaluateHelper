<template>
  <view class="container">
    <!-- 搜索区域 -->
    <view class="search-container">
      <view class="search-box">
        <uni-icons type="search" size="18" color="#999"></uni-icons>
        <input 
          type="text" 
          v-model="searchText" 
          placeholder="搜索视频或分类" 
          confirm-type="search"
          @confirm="handleSearch"
          @input="handleSearchInput"
        />
        <uni-icons 
          v-if="searchText" 
          type="clear" 
          size="18" 
          color="#999" 
          @click="clearSearch"
        ></uni-icons>
      </view>
    </view>
    
    <!-- 分类导航 -->
    <scroll-view scroll-x class="category-scroll" show-scrollbar="false">
      <view 
        class="category-item" 
        v-for="category in categories" 
        :key="category.id"
        :class="{'active': currentCategory === category.id}"
        @tap="switchCategory(category.id)"
      >
        {{category.name}}
      </view>
    </scroll-view>
    
    <!-- 加载错误提示 -->
    <view v-if="loadError" class="error-tip">
      <image src="/static/error-icon.png" mode="aspectFit" class="error-icon"></image>
      <text>{{loadError}}</text>
      <button class="retry-btn" @tap="loadVideoList">重试</button>
    </view>
    
    <!-- 加载中提示 -->
    <view v-if="isLoading && !loadError" class="loading-box">
      <view class="loading-spinner"></view>
      <text>加载中...</text>
    </view>
    
    <!-- 视频列表 -->
    <scroll-view 
      scroll-y 
      class="video-scroll" 
      v-if="!loadError && filteredVideoList.length > 0"
      @scrolltolower="loadMore"
      refresher-enabled
      :refresher-triggered="isRefreshing"
      @refresherrefresh="onRefresh"
    >
      <view class="video-grid">
        <view 
          class="video-card"
          v-for="video in filteredVideoList"
          :key="video._id"
          @tap="goToVideoDetail(video)"
        >
          <!-- 视频缩略图 -->
          <view class="video-cover">
            <image 
              :src="video.cover || '/static/video-placeholder.png'" 
              mode="aspectFill"
              class="cover-image"
            ></image>
            <view class="play-icon">
              <view class="play-triangle"></view>
            </view>
            <!-- 视频时长 -->
            <text class="video-duration" v-if="video.duration">
              {{formatDuration(video.duration)}}
            </text>
          </view>
          
          <!-- 视频信息 -->
          <view class="video-info">
            <text class="video-title">{{video.title}}</text>
            <view class="category-tag" v-if="video.categoryName">
              <text>{{video.categoryName}}</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 底部加载状态 -->
      <view class="load-more" v-if="videoList.length > 0">
        <text v-if="hasMore">正在加载更多...</text>
        <text v-else>- 到底啦，没有更多视频了 -</text>
      </view>
    </scroll-view>
    
    <!-- 搜索结果为空状态 -->
    <view v-if="!isLoading && searchText && filteredVideoList.length === 0" class="empty-state">
      <image src="/static/search-empty.png" mode="aspectFit" class="empty-icon"></image>
      <text>未找到"{{searchText}}"相关视频</text>
      <button class="retry-btn" @tap="clearSearch">清除搜索</button>
    </view>
    
    <!-- 无视频状态 -->
    <view v-if="!isLoading && !searchText && videoList.length === 0" class="empty-state">
      <image src="/static/empty-icon.png" mode="aspectFit" class="empty-icon"></image>
      <text>暂无视频</text>
    </view>
  </view>
</template>

<script>
import { store } from '/uni_modules/uni-id-pages/common/store.js';	
export default {
  data() {
    return {
      searchText: '',
      videoList: [],
      categories: [
        { id: 'all', name: '全部' }
      ],
      currentCategory: 'all',
      isLoading: false,
      isRefreshing: false,
      loadError: '',
      categoryCache: {},
      page: 1,
      pageSize: 10,
      hasMore: true,
      debounceTimer: null
    }
  },
  
  computed: {
    // 过滤后的视频列表
    filteredVideoList() {
      if (!this.searchText && this.currentCategory === 'all') {
        return this.videoList;
      }
      
      return this.videoList.filter(video => {
        // 根据分类筛选
        const categoryMatch = this.currentCategory === 'all' || 
                            video.categoryId === this.currentCategory;
        
        // 搜索文本为空时只筛选分类
        if (!this.searchText) {
          return categoryMatch;
        }
        
        // 根据标题和分类名称搜索
        const searchLower = this.searchText.toLowerCase();
        const titleMatch = video.title.toLowerCase().includes(searchLower);
        const categoryNameMatch = video.categoryName && 
                                video.categoryName.toLowerCase().includes(searchLower);
        
        // 同时匹配分类和搜索条件
        return categoryMatch && (titleMatch || categoryNameMatch);
      });
    }
  },
 
  
  onShow() {
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
	if(memberInfo.cardCategory === 'review'){
		uni.showToast({
			title: '您购买的卡密没有权限进入该页面',
			icon:'none'
		})
		uni.switchTab({
			url:'/pages/MyPage/MyPage'
		})
		return ;
	}
    this.loadCategories();
    this.loadVideoList(true);
  },
  
  methods: {
    // 加载分类数据
    async loadCategories() {
      try {
        const db = uniCloud.database();
        const { result } = await db.collection('Category')
          .orderBy('createdAt', 'asc')
          .get();
        
        if (result && result.data && result.data.length > 0) {
          // 建立分类缓存
          result.data.forEach(category => {
            const id = category.categoryId || category._id;
            this.categoryCache[id] = category.name;
          });
          
          // 更新分类列表
          this.categories = [
            { id: 'all', name: '全部' },
            ...result.data.map(category => ({
              id: category.categoryId || category._id,
              name: category.name
            }))
          ];
        }
      } catch (err) {
        console.warn('获取分类数据失败:', err);
        // 使用测试分类数据
        this.categoryCache = this.getTestCategories();
        this.categories = [
          { id: 'all', name: '全部' },
          ...Object.entries(this.categoryCache).map(([id, name]) => ({
            id,
            name
          }))
        ];
      }
    },
    
    // 加载视频列表
    async loadVideoList(reset = false) {
      if (this.isLoading) return;
      
      if (reset) {
        this.page = 1;
        this.hasMore = true;
        this.videoList = [];
      }
      
      if (!this.hasMore && !reset) return;
      
      this.isLoading = true;
      this.loadError = '';
      
      try {
        // 尝试从数据库获取视频
        try {
          const db = uniCloud.database();
          let query = db.collection('Video')
            .orderBy('uploadTime', 'desc');
            
          // 如果选择了特定分类且不是搜索模式，添加分类过滤
          if (this.currentCategory !== 'all' && !this.searchText) {
            query = query.where({ categoryId: this.currentCategory });
          }
          // 执行分页查询
          const { result } = await query
            .skip((this.page - 1) * this.pageSize)
            .limit(this.pageSize)
            .get();
            
          if (result && result.data) {
            // 添加分类名称
            const newVideos = result.data.map(video => {
              return {
                ...video,
                categoryName: this.getCategoryName(video.categoryId)
              };
            });
            
            // 更新视频列表
            if (reset) {
              this.videoList = newVideos;
            } else {
              this.videoList = [...this.videoList, ...newVideos];
            }
            
            // 检查是否还有更多数据
            this.hasMore = newVideos.length === this.pageSize;
          } else {
            throw new Error('未获取到视频数据');
          }
        } catch (dbError) {
          console.warn('数据库获取视频列表失败:', dbError);
          
          // 仅在初始加载时使用测试数据
          if (reset && this.videoList.length === 0) {
            this.videoList = this.getTestVideoData();
            this.hasMore = false;
          }
        }
      } catch (error) {
        console.error('加载视频列表失败:', error);
        this.loadError = '加载失败，请重试';
      } finally {
        this.isLoading = false;
        this.isRefreshing = false;
      }
    },
    
    // 获取分类名称
    getCategoryName(categoryId) {
      if (!categoryId) return '未分类';
      return this.categoryCache[categoryId] || '未知分类';
    },
    
    // 切换分类
    switchCategory(categoryId) {
      if (this.currentCategory === categoryId) return;
      this.currentCategory = categoryId;
      
      // 如果没有搜索关键词，切换分类时重新加载数据
      if (!this.searchText) {
        this.loadVideoList(true);
      }
      // 否则仅通过计算属性筛选现有数据
    },
    
    // 处理搜索输入
    handleSearchInput() {
      // 防抖处理，避免频繁触发搜索
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        // 如果搜索框为空，恢复分类筛选的结果
        if (!this.searchText && this.currentCategory !== 'all') {
          this.loadVideoList(true);
        }
      }, 500);
    },
    
    // 处理搜索确认
    handleSearch() {
      // 如果搜索框为空，不执行任何操作
      if (!this.searchText.trim()) return;
      
      // 如果当前分类不是"全部"且搜索文本不为空，先加载全部数据
      if (this.currentCategory !== 'all') {
        // 保存当前分类以便搜索后恢复
        const savedCategory = this.currentCategory;
        
        // 临时切换到"全部"分类
        this.currentCategory = 'all';
        
        // 加载数据后恢复分类（但显示的是搜索结果）
        this.loadVideoList(true).then(() => {
          this.currentCategory = savedCategory;
        });
      } else {
        // 直接通过计算属性筛选现有数据
      }
    },
    
    // 清除搜索
    clearSearch() {
      this.searchText = '';
      // 根据当前选中的分类重新加载数据
      this.loadVideoList(true);
    },
    
    // 下拉刷新
    onRefresh() {
      this.isRefreshing = true;
      this.loadVideoList(true);
    },
    
    // 加载更多
    loadMore() {
      if (!this.isLoading && this.hasMore && !this.searchText) {
        this.page++;
        this.loadVideoList();
      }
    },
    
    // 跳转到视频详情页
    goToVideoDetail(video) {
      // 将视频信息存储到全局数据，以便详情页获取
      getApp().globalData = getApp().globalData || {};
      getApp().globalData.currentVideo = video;
      
      // 跳转到详情页
      uni.navigateTo({
        url: `/pages/video/video?id=${video._id}`
      });
    },
    
    // 格式化时长
    formatDuration(seconds) {
      if (!seconds) return '00:00';
      
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      
      if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}:${String(remainingMinutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
      }
      
      return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    },
    
    // 获取测试分类数据
    getTestCategories() {
      return {
        'frontend': '前端开发',
        'backend': '后端开发',
        'database': '数据库',
        'design': '设计',
        'mobile': '移动开发'
      };
    },
    
    // 获取测试视频数据
    getTestVideoData() {
      return [
        {
          _id: '1',
          title: 'Web前端开发入门教程',
          url: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
          thumbnail: '/static/video-placeholder.png',
          duration: 52,
          categoryId: 'frontend',
          categoryName: '前端开发'
        },
        {
          _id: '2',
          title: 'UI设计基础与配色方案',
          url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
          thumbnail: '/static/video-placeholder.png',
          duration: 8,
          categoryId: 'design',
          categoryName: '设计'
        },
        {
          _id: '3',
          title: 'Node.js服务器开发实战',
          url: 'https://media.w3.org/2010/05/bunny/trailer.mp4',
          thumbnail: '/static/video-placeholder.png',
          duration: 33,
          categoryId: 'backend',
          categoryName: '后端开发'
        },
        {
          _id: '4',
          title: 'MySQL数据库优化技巧',
          url: 'https://media.w3.org/2010/05/bunny/movie.mp4',
          thumbnail: '/static/video-placeholder.png',
          duration: 28,
          categoryId: 'database',
          categoryName: '数据库'
        }
      ];
    }
  }
};
</script>

<style>
.container {
  background-color: #f5f7fa;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.search-container {
  background-color: #fff;
  padding: 20rpx 30rpx;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
  position: sticky;
  top: 0;
  z-index: 100;
}

.search-box {
  display: flex;
  align-items: center;
  background-color: #f2f3f5;
  border-radius: 40rpx;
  padding: 15rpx 20rpx;
}

.search-box uni-icons {
  margin: 0 15rpx;
}

.search-box input {
  flex: 1;
  font-size: 28rpx;
  height: 40rpx;
  color: #333;
}

.category-scroll {
  background-color: #fff;
  white-space: nowrap;
  padding: 15rpx 0;
  margin-bottom: 15rpx;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.03);
}

.category-item {
  display: inline-block;
  padding: 12rpx 30rpx;
  margin: 0 10rpx;
  font-size: 28rpx;
  color: #666;
  background-color: #f2f3f5;
  border-radius: 30rpx;
  transition: all 0.3s;
}

.category-item:first-child {
  margin-left: 20rpx;
}

.category-item:last-child {
  margin-right: 20rpx;
}

.category-item.active {
  color: #fff;
  background: linear-gradient(to right, #3b7dff, #42a5ff);
  box-shadow: 0 4rpx 10rpx rgba(59, 125, 255, 0.2);
}

.loading-box {
  padding: 80rpx 0;
  text-align: center;
  color: #999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid rgba(66, 165, 255, 0.1);
  border-left-color: #42a5ff;
  border-radius: 50%;
  margin-bottom: 20rpx;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-tip {
  margin: 40rpx;
  padding: 50rpx 30rpx;
  text-align: center;
  background-color: #fff;
  border-radius: 20rpx;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.06);
  color: #666;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.error-icon {
  width: 100rpx;
  height: 100rpx;
  margin-bottom: 20rpx;
}

.retry-btn {
  margin-top: 30rpx;
  padding: 15rpx 50rpx;
  font-size: 28rpx;
  color: #fff;
  border: none;
  border-radius: 50rpx;
  background: linear-gradient(to right, #3b7dff, #42a5ff);
  box-shadow: 0 4rpx 16rpx rgba(66, 165, 255, 0.3);
  transition: transform 0.2s, box-shadow 0.2s;
}

.retry-btn:active {
  transform: scale(0.98);
  box-shadow: 0 2rpx 8rpx rgba(66, 165, 255, 0.2);
}

.video-scroll {
  flex: 1;
  overflow: hidden;
}

.video-grid {
  display: flex;
  flex-wrap: wrap;
  padding: 15rpx;
}

.video-card {
  width: calc(50% - 20rpx);
  margin: 10rpx;
  background-color: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.08);
  transition: transform 0.3s, box-shadow 0.3s;
  position: relative;
}

.video-card:active {
  transform: scale(0.96);
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
}

.video-cover {
  position: relative;
  width: 100%;
  height: 200rpx;
  background-color: #eee;
  overflow: hidden;
}

.cover-image {
  width: 100%;
  height: 100%;
  transition: transform 0.5s;
}

.video-card:active .cover-image {
  transform: scale(1.05);
}

.play-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 50rpx;
  height: 50rpx;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.play-triangle {
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 8rpx 0 8rpx 16rpx;
  border-color: transparent transparent transparent #fff;
  margin-left: 4rpx;
}

.video-duration {
  position: absolute;
  right: 10rpx;
  bottom: 10rpx;
  background-color: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 22rpx;
  padding: 4rpx 10rpx;
  border-radius: 4rpx;
}

.video-info {
  padding: 16rpx;
  position: relative;
}

.video-title {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;
  margin-bottom: 12rpx;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  min-height: 72rpx;
  line-height: 1.4;
}

.category-tag {
  display: inline-block;
  font-size: 20rpx;
  color: #3b7dff;
  background-color: rgba(59, 125, 255, 0.1);
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
}

.empty-state {
  margin: 60rpx 30rpx;
  padding: 80rpx 0;
  text-align: center;
  color: #999;
  background-color: #fff;
  border-radius: 20rpx;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.empty-icon {
  width: 180rpx;
  height: 180rpx;
  margin-bottom: 30rpx;
}

.load-more {
  text-align: center;
  color: #999;
  font-size: 24rpx;
  padding: 30rpx 0 40rpx;
}
</style>