<template>
  <view class="page-container">
    <!-- 背景效果 -->
    <view class="background">
      <view class="gradient-orb"></view>
      <view class="gradient-orb"></view>
      <view class="gradient-orb"></view>
    </view>

    <!-- 主要内容区域 -->
    <view class="content-wrapper">
      <view class="content-card">
        <!-- 页面标题 -->
        <view class="header">
          <text class="title">测评信息填写</text>
        </view>

        <!-- 表单区域 -->
        <view class="form-content">
          <!-- 姓名输入 -->
          <view class="input-group">
            <text class="label">姓名</text>
            <input 
              type="text"
              v-model="formData.name"
              placeholder="请输入您的姓名"
              class="input-box"
            />
          </view>

          <!-- 文件上传 -->
          <view class="input-group">
            <text class="label">上传视频</text>
            <view 
              v-show="!formData.LocalfileUrl" 
              ref="uploadBox"
              class="upload-box"
              @tap="chooseFile"
            >
              <view class="upload-placeholder">
                <text class="upload-icon">📤</text>
                <text class="upload-text">点击上传视频</text>
                <text class="upload-desc">支持MP4格式</text>
              </view>
            </view>
            <view v-show="formData.LocalfileUrl" class="video-preview">
              <video class="video-player" :src="formData.LocalfileUrl" controls></video>
            </view>
          </view>

          <!-- 按钮 -->
          <button v-if="formData.LocalfileUrl" class="delete-btn" @tap="deleteFile">
            <text>删除视频</text>
          </button>

          <button 
            class="submit-btn"
            :class="{'btn-active': formData.name && formData.LocalfileUrl}"
            @tap="submitForm"
          >
            <text>提交</text>
          </button>
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
      formData: {
        name: '',
        LocalfileUrl: '',
        fileUrl: ''
      }
    }
  },
  mounted() {
    this.$nextTick(() => {
      const query = uni.createSelectorQuery().in(this);
      query.select('.upload-box').boundingClientRect((res) => {
        if (res) {
          console.log('上传框尺寸:', res);
        } else {
          console.warn('上传框未找到');
        }
      }).exec();
    });
  },
  methods: {
    async chooseFile() {
      try {
        const chooseVideoResult = await new Promise((resolve, reject) => {
          uni.chooseVideo({
            count: 1,
            sourceType: ['album', 'camera'],
            success: resolve,
            fail: reject,
          });
        });
        this.formData.LocalfileUrl = chooseVideoResult.tempFilePath;
        uni.showToast({ title: '视频已选择', icon: 'success' });
      } catch (error) {
        console.error('选择视频失败:', error);
        uni.showToast({ title: '选择视频失败，请重试', icon: 'none' });
      }
    },
    
    deleteFile() {
      uni.showModal({
        title: '确认删除',
        content: '确认删除视频吗？',
        success: (res) => {
          if (res.confirm) {
            this.formData.LocalfileUrl = '';
            uni.showToast({ title: '视频已删除', icon: 'success' });
          }
        }
      });
    },

    async submitForm() {
      try {
        if (!this.formData.LocalfileUrl) {
          uni.showToast({ title: '请先上传视频', icon: 'none' });
          return;
        }
        uni.showLoading({ title: '提交中' });

        const userId = store.userInfo._id;

        const uploadResult = await uniCloud.uploadFile({
          filePath: this.formData.LocalfileUrl,
          cloudPath: `Video/${userId}-${Date.now()}.mp4`,
          cloudPathAsRealPath: true
        });

        this.formData.fileUrl = uploadResult.fileID;

        const res = await uniCloud.callFunction({
          name: 'SubmitEvaData',
          data: {
            userId,
            name: this.formData.name,
            fileUrl: this.formData.fileUrl,
            timestamp: Date.now(),
            fileformat: this.formData.LocalfileUrl.split('.').pop().toLowerCase(),
          },
        });

        if (res.result.success) {
          uni.showToast({ title: '已提交', icon: 'success' });
          uni.navigateTo({ url: '/pages/Confirm/Confirm' });
        } else {
          uni.showToast({ title: res.result.message || '提交失败', icon: 'none' });
        }
      } catch (error) {
        console.error('提交失败:', error);
        uni.showToast({ title: '系统错误，请稍后重试', icon: 'none' });
      } finally {
        uni.hideLoading();
      }
    }
  }
}
</script>
<style>
/* 页面容器样式 */
.page-container {
  min-height: 100vh;
  background: #F8FAFC;
  position: relative;
  overflow: hidden;
}

/* 背景效果 */
.background {
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 1;
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60rpx);
}

/* 不同背景光圈效果 */
.gradient-orb:nth-child(1) {
  width: 600rpx;
  height: 600rpx;
  background: linear-gradient(135deg, rgba(91, 33, 182, 0.1), rgba(67, 56, 202, 0.05));
  top: -200rpx;
  right: -100rpx;
  animation: float1 20s ease-in-out infinite alternate;
}

.gradient-orb:nth-child(2) {
  width: 500rpx;
  height: 500rpx;
  background: linear-gradient(225deg, rgba(99, 102, 241, 0.08), rgba(79, 70, 229, 0.05));
  bottom: -150rpx;
  left: -100rpx;
  animation: float2 15s ease-in-out infinite alternate-reverse;
}

.gradient-orb:nth-child(3) {
  width: 400rpx;
  height: 400rpx;
  background: linear-gradient(45deg, rgba(139, 92, 246, 0.06), rgba(99, 102, 241, 0.03));
  top: 40%;
  left: 60%;
  animation: float3 18s ease-in-out infinite alternate;
}

/* 内容区域样式 */
.content-wrapper {
  position: relative;
  z-index: 2;
  min-height: 100vh;
  padding: 40rpx 30rpx;
  animation: fadeIn 0.8s ease-out;
}

.content-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10rpx);
  border-radius: 24rpx;
  padding: 40rpx 20rpx;
  border: 1rpx solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  width: 100%;
  box-sizing: border-box;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 50rpx;
}

.title {
  font-size: 36rpx;
  font-weight: 600;
  color: #1E293B;
  margin-bottom: 12rpx;
}

.form-content {
  padding: 0 20rpx;
  width: 100%;
  box-sizing: border-box;
}

/* 输入框组样式 */
.input-group {
  margin-bottom: 40rpx;
}

.label {
  font-size: 28rpx;
  color: #475569;
  margin-bottom: 16rpx;
  display: block;
  font-weight: 500;
}

.input-box {
  width: 100%;
  height: 88rpx;
  background: rgba(255, 255, 255, 0.8);
  border: 2rpx solid rgba(0, 0, 0, 0.1);
  border-radius: 12rpx;
  padding: 0 30rpx;
  font-size: 28rpx;
  color: #1E293B;
  transition: all 0.3s ease;
}

.input-box:focus {
  border-color: #6366F1;
  background: #FFFFFF;
  box-shadow: 0 0 0 2rpx rgba(99, 102, 241, 0.1);
}

.input-placeholder {
  color: #94A3B8;
}

/* 上传框样式 */
.upload-box {
  width: 100%;
  min-height: 240rpx;
  border: 2rpx dashed rgba(0, 0, 0, 0.1);
  border-radius: 12rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.8);
  transition: all 0.3s ease;
}

.upload-box-active {
  border-color: #6366F1;
  background: rgba(99, 102, 241, 0.05);
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 20rpx;
}

.upload-icon {
  font-size: 60rpx;
  margin-bottom: 16rpx;
}

.upload-text {
  font-size: 28rpx;
  color: #475569;
  margin-bottom: 8rpx;
}

.upload-desc {
  font-size: 24rpx;
  color: #94A3B8;
}

/* 视频预览样式 */
.video-preview {
  width: 100%;
  position: relative;
  margin-top: 20rpx;
}

.video-player {
  width: 100%;
  height: 300rpx;
  border-radius: 12rpx;
  background: #000;
}

/* 删除按钮样式 */
.delete-btn {
  width: 100%;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 44rpx;
  margin-top: 60rpx;
  margin-bottom: 20rpx;
  color: #ef4444;
  font-size: 32rpx;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.delete-btn:active {
  background: rgba(239, 68, 68, 0.2);
  transform: scale(0.98);
}

/* 提交按钮样式 */
.submit-btn {
  width: 100%;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 44rpx;
  margin-top: 60rpx;
  color: #94A3B8;
  font-size: 32rpx;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.btn-active {
  background: linear-gradient(135deg, #8B5CF6, #6366F1);
  color: #FFFFFF;
  box-shadow: 0 4rpx 12rpx rgba(139, 92, 246, 0.2);
}

.btn-active:active {
  transform: scale(0.98) translateY(2rpx);
  box-shadow: 0 2rpx 8rpx rgba(139, 92, 246, 0.15);
}

.btn-arrow {
  width: 16rpx;
  height: 16rpx;
  border-right: 3rpx solid currentColor;
  border-top: 3rpx solid currentColor;
  transform: rotate(45deg);
  margin-left: 12rpx;
  transition: transform 0.3s ease;
}

/* 动画效果 */
@keyframes float1 {
  0% { transform: translate(0, 0) rotate(0deg); }
  100% { transform: translate(30rpx, -30rpx) rotate(5deg); }
}

@keyframes float2 {
  0% { transform: translate(0, 0) rotate(0deg); }
  100% { transform: translate(-20rpx, 20rpx) rotate(-5deg); }
}

@keyframes float3 {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(20rpx, -20rpx) scale(1.1); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}</style>