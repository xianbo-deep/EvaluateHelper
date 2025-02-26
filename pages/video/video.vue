<template>
  <view class="container">
    <!-- Video player area -->
    <view class="video-container">
      <video 
        v-if="videoData"
        :src="videoData.url"
        id="videoPlayer"
        class="video-player"
        :poster="videoData.thumbnail || '/static/video-placeholder.png'"
        controls
        
        :enable-progress-gesture="completed"
        :show-progress="completed"
        @error="handleVideoError"
        @timeupdate="onTimeUpdate"
        @play="onVideoPlay"
        @pause="onVideoPause"
        @ended="onVideoEnded"
        @loaded="onVideoLoaded"
      ></video>
      
      <view v-if="videoError" class="error-box">
        <text>{{ videoError }}</text>
        <button class="retry-btn" @tap="retryVideo">重试</button>
      </view>
    </view>
    
    <view class="video-info-container" v-if="videoData">
      <view class="header-row">
        <text class="video-title">{{ videoData.title }}</text>
        <view class="category-tag" v-if="videoData.categoryName">
          <text>{{ videoData.categoryName }}</text>
        </view>
      </view>
      
      <view class="video-description" v-if="videoData.description">
        <text>{{ videoData.description }}</text>
      </view>
    </view>
    
    <view class="progress-card">
      <view class="card-title">
        <text>学习进度</text>
      </view>
      
      <view class="progress-info">
        <view class="progress-bar">
          <view 
            class="progress-fill"
            :style="{ width: progress + '%' }"
          ></view>
        </view>
        
        <view class="progress-data">
          <view class="progress-item">
            <text class="progress-label">已学习</text>
            <text class="progress-value">{{ formatDuration(watchedDuration) }}</text>
          </view>
          
          <view class="progress-item">
            <text class="progress-label">总时长</text>
            <text class="progress-value">{{ formatDuration(videoData?.duration || 0) }}</text>
          </view>
          
          <view class="progress-item">
            <text class="progress-label">完成率</text>
            <text class="progress-value">{{ progress }}%</text>
          </view>
        </view>
        
        <view class="progress-status">
          <view class="status-tag" :class="{ 'completed': completed }">
            <text>{{ completed ? '已完成' : '学习中' }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
const db = uniCloud.database();
const dbCmd = db.command;
import { store } from '/uni_modules/uni-id-pages/common/store.js';	

export default {
  data() {
    return {
      videoId: '',
      videoData: null,
      videoError: '',
      watchedDuration: 0,
      completed: false,
      lastSaveTime: 0,
      saveInterval: 10000,
      isPlaying: false,
      videoContext: null,
      progressUpdateTimer: null,
      userId: '',
      progressId: null,
      progress: 0,
      viewCount: 1,
      categoryId: '',
      lastPosition: 0,
      isVideoReady: false
    }
  },
  
  onLoad(options) {
    if (options.id) {
      this.videoId = options.id
      this.userId = store.userInfo._id || ''
      
      this.loadVideoData()
      this.$nextTick(() => {
        this.videoContext = uni.createVideoContext('videoPlayer', this)
      })
    } else {
      uni.showToast({
        title: '参数错误',
        icon: 'none'
      })
    }
  },

  onReady() {
    this.videoContext = uni.createVideoContext('videoPlayer', this)
  },

  onUnload() {
    this.saveProgress()
    if (this.progressUpdateTimer) {
      clearInterval(this.progressUpdateTimer)
    }
  },
  
  methods: {
    async loadVideoData() {
      try {
        uni.showLoading({ mask: true })
        
        const { result } = await db.collection('Video')
          .doc(this.videoId)
          .get()
        
        if (!result.data || result.data.length === 0) {
          throw new Error('未找到视频数据')
        }

        this.videoData = result.data[0]
        this.categoryId = this.videoData.categoryId || ''
        
        await this.loadUserProgress()
        
        uni.hideLoading()
      } catch (error) {
        console.error('加载视频数据失败:', error)
        uni.showToast({
          title: '加载视频失败',
          icon: 'none'
        })
      }
    },

    async loadUserProgress() {
      if (!this.videoId || !this.userId) return
      
      try {
        const { result } = await db.collection('Progress')
          .where({
            videoId: this.videoId,
            userId: this.userId
          })
          .get()
        
        if (result.data && result.data.length > 0) {
          const progress = result.data[0]
          this.progressId = progress._id
          this.watchedDuration = progress.watchedDuration || 0
          this.completed = progress.completed || false
          this.progress = progress.progress || 0
          this.lastPosition = progress.watchedDuration || 0
          this.viewCount = progress.viewCount || 1
    
          if (this.lastPosition > 0 && !this.completed) {
            this.$nextTick(() => {
              setTimeout(() => {
                this.askResumeProgress()
              }, 500)
            })
          }
        }
      } catch (error) {
        console.error('加载用户进度失败:', error)
      }
    },

    askResumeProgress() {
      if (!this.videoContext) {
        this.videoContext = uni.createVideoContext('videoPlayer', this)
      }
      
     this.videoContext.seek(this.lastPosition)
     setTimeout(() => {
       this.videoContext.play()
     }, 100)
    },
    
    onVideoLoaded() {
      this.isVideoReady = true
      if (this.videoContext && this.lastPosition > 0 && !this.completed) {
        this.videoContext.seek(this.lastPosition)
      }
    },

    onTimeUpdate(e) {
      const currentTime = e.detail.currentTime
      this.watchedDuration = Math.max(this.watchedDuration, Math.floor(currentTime))
      this.lastPosition = Math.floor(currentTime)
      
      if (this.videoData?.duration) {
        this.progress = Math.min(100, Math.round((this.watchedDuration / this.videoData.duration) * 100))
      }
      
      const now = Date.now()
      if (now - this.lastSaveTime >= this.saveInterval) {
        this.saveProgress()
        this.lastSaveTime = now
      }

      this.completed = this.progress >= 90
    },

    async saveProgress() {
      if (!this.videoId || !this.userId || !this.videoData) return
    
      try {
        const progressData = {
          videoId: this.videoId,
          userId: this.userId,
          watchedDuration: this.watchedDuration,
          completed: this.completed,
          progress: this.progress,
          title: this.videoData.title,
          lastPosition: this.lastPosition,
          videoDuration: this.videoData.duration || 0,
          updateTime: Date.now(),
          categoryId: this.categoryId
        }
        
        if (this.progressId) {
          await db.collection('Progress').doc(this.progressId).update(progressData)
        } else {
          const { result } = await db.collection('Progress').add({
            ...progressData,
            viewCount: 1,
            createTime: Date.now()
          })
          
          if (result && result.id) {
            this.progressId = result.id
            
            await db.collection('Video').doc(this.videoId).update({
              viewCount: dbCmd.inc(1)
            })
          }
        }
      } catch (error) {
        console.error('保存进度失败:', error)
      }
    },
    
    onVideoPlay() {
      this.isPlaying = true
      this.startProgressTimer()
    },

    onVideoPause() {
      this.isPlaying = false
      this.saveProgress()
      if (this.progressUpdateTimer) {
        clearInterval(this.progressUpdateTimer)
      }
    },

    onVideoEnded() {
      this.isPlaying = false
      this.completed = true
      this.saveProgress()
      
      if (this.completed && this.progressId) {
        db.collection('Video').doc(this.videoId).update({
          completionCount: dbCmd.inc(1)
        }).catch(err => {
          console.error('更新视频完成数失败:', err)
        })
      }
      
      if (this.progressUpdateTimer) {
        clearInterval(this.progressUpdateTimer)
      }
    },

    startProgressTimer() {
      if (this.progressUpdateTimer) {
        clearInterval(this.progressUpdateTimer)
      }
      this.progressUpdateTimer = setInterval(() => {
        if (this.isPlaying) {
          this.saveProgress()
        }
      }, this.saveInterval)
    },

    handleVideoError(err) {
      console.error('视频播放错误:', err)
      this.videoError = '视频播放失败，请检查网络连接或视频地址是否有效'
    },
    
    retryVideo() {
      this.videoError = ''
      if (this.videoContext) {
        this.videoContext.stop()
        this.videoContext.play()
      }
    },
    
    formatDuration(seconds) {
      // 更严格的空值检查
      if (seconds === null || seconds === undefined || seconds === '') {
        return '00:00'
      }
      console.log(seconds)
      // 确保转换为数字类型
      seconds = Number(seconds)
      
      // 检查是否为有效数字
      if (isNaN(seconds)) {
        return '00:00'
      }
      
      // 向下取整确保为整数
      seconds = Math.floor(seconds)
      
      // 处理小时
      const hours = Math.floor(seconds / 3600)
      // 处理分钟
      const minutes = Math.floor((seconds % 3600) / 60)
      // 处理秒
      const remainingSeconds = Math.floor(seconds % 60)
      
      if (hours > 0) {
        // 有小时，返回 HH:MM:SS 格式
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
      }
      
      // 无小时，返回 MM:SS 格式
      return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
    }
  }
}
</script>

<style>
.container {
  padding: 30rpx;
  background: #f5f7fa;
  min-height: 100vh;
}

.video-container {
  width: 100%;
  margin-bottom: 40rpx;
  background: #000;
  position: relative;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.video-player {
  width: 100%;
  height: 422rpx;
}

.error-box {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #fff;
  background: rgba(0, 0, 0, 0.6);
  padding: 30rpx;
  border-radius: 12rpx;
  backdrop-filter: blur(10rpx);
}

.retry-btn {
  margin-top: 20rpx;
  padding: 12rpx 36rpx;
  font-size: 28rpx;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  border-radius: 8rpx;
  transition: all 0.3s ease;
}

.retry-btn:active {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(0.98);
}

.video-info-container {
  margin-bottom: 30rpx;
  padding: 24rpx;
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.video-title {
  font-size: 34rpx;
  font-weight: 600;
  flex: 1;
  margin-right: 20rpx;
  color: #1a1a1a;
  line-height: 1.4;
}

.category-tag {
  padding: 6rpx 20rpx;
  background: rgba(0, 102, 204, 0.1);
  border-radius: 8rpx;
  font-size: 24rpx;
  color: #0066cc;
  font-weight: 500;
}

.video-description {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
}

.progress-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.card-title {
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 36rpx;
  color: #1a1a1a;
}

.progress-bar {
  width: 100%;
  height: 10rpx;
  background: #f0f0f0;
  border-radius: 6rpx;
  margin-bottom: 36rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #0066cc, #0095ff);
  border-radius: 6rpx;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.progress-data {
  display: flex;
  justify-content: space-between;
  margin-bottom: 36rpx;
  padding: 0 20rpx;
}

.progress-item {
  text-align: center;
  flex: 1;
}

.progress-label {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 10rpx;
  display: block;
}

.progress-value {
  font-size: 30rpx;
  color: #1a1a1a;
  font-weight: 600;
}

.progress-status {
  display: flex;
  justify-content: flex-end;
}

.status-tag {
  padding: 8rpx 24rpx;
  background: rgba(255, 153, 0, 0.1);
  border-radius: 8rpx;
  font-size: 26rpx;
  color: #ff9900;
  font-weight: 500;
  transition: all 0.3s ease;
}

.status-tag.completed {
  background: rgba(82, 196, 26, 0.1);
  color: #52c41a;
}
</style>