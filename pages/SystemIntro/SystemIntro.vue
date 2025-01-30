<template>
  <view class="container">
    <!-- 标题 -->
    <view class="header">
      <text class="title">智能主播测评系统</text>
    </view>

    <!-- 系统介绍 -->
    <view class="content-card">
      <text class="content-text">
        智能主播测评系统是一款基于多模态分析技术（视频、语音、文本）的创新应用，通过表情颜值、语音情绪和话术内容对主播的直播表现进行全面评估，并提供有针对性的优化建议。结合多Agent协同工作和Serverless GPU后台处理，本系统高效生成专业测评报告，助力主播提升表现，赋能直播行业智能化发展。
      </text>
    </view>

    <!-- 操作按钮 -->
    <view class="button-group">
      <button class="primary-button" @click="startEvaluation">开始测评</button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {};
  },
  methods: {
    startEvaluation() {
      // 跳转到测评页面
      uni.switchTab({
        url: "/pages/EvaluationPage/EvaluationPage",
      });
    },
  },
};
</script>

<style>
/* 页面容器样式 */
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx;
  background: linear-gradient(to bottom, #f0f8ff, #e6f7ff);
  height: 100vh;
}

/* 标题部分样式 */
.header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 40rpx;
}

.logo {
  width: 150rpx;
  height: 150rpx;
  margin-bottom: 20rpx;
}

.title {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  text-align: center;
}

/* 内容部分样式 */
.content-card {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin: 20rpx;
  box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.1);
  width: 90%;
}

.content-text {
  font-size: 28rpx;
  line-height: 1.8;
  color: #666;
  text-align: justify;
}

/* 按钮部分样式 */
.button-group {
  display: flex;
  justify-content: center;
  gap: 20rpx;
  margin-top: 40rpx;
}

.primary-button {
  background-color: #1890ff;
  color: #fff;
  font-size: 30rpx;
  padding: 20rpx 40rpx;
  border-radius: 10rpx;
  box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
}

.secondary-button {
  background-color: #f0f0f0;
  color: #333;
  font-size: 30rpx;
  padding: 20rpx 40rpx;
  border-radius: 10rpx;
  box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
}
</style>
