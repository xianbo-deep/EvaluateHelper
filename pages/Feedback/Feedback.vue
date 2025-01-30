<template>
  <view class="feedback-container">
    <!-- 顶部导航栏 -->
    <view class="navbar">
      <text class="navbar-title">意见反馈</text>
    </view>

    <!-- 表单区域 -->
    <view class="form">
      <!-- 反馈类型选择 -->
      <view class="form-item">
        <text class="label">反馈类型</text>
        <picker mode="selector" :range="feedbackTypes" @change="onTypeChange">
          <view class="picker">
            {{ feedbackTypes[selectedTypeIndex] }}
          </view>
        </picker>
      </view>

      <!-- 反馈内容输入 -->
      <view class="form-item">
        <text class="label">反馈内容</text>
        <textarea
          class="textarea"
          placeholder="请输入您的反馈内容"
          v-model="feedbackContent"
          maxlength="500"
        ></textarea>
      </view>

      <!-- 联系方式输入 -->
      <view class="form-item">
        <text class="label">联系方式</text>
        <input
          class="input"
          type="text"
          placeholder="请输入您的邮箱或手机号"
          v-model="contactInfo"
        />
      </view>
    </view>

    <!-- 提交按钮 -->
    <view class="submit-btn" @click="submitFeedback">
      <text>提交反馈</text>
    </view>
  </view>
</template>

<script>
import { store } from '/uni_modules/uni-id-pages/common/store.js';
export default {
  data() {
    return {
      feedbackTypes: ['功能建议', 'BUG反馈', '其他'], // 反馈类型选项
      selectedTypeIndex: 0, // 当前选中的反馈类型索引
      feedbackContent: '', // 反馈内容
      contactInfo: '', // 联系方式
    };
  },
  methods: {
    // 反馈类型选择事件
    onTypeChange(e) {
      this.selectedTypeIndex = e.detail.value;
    },

    // 提交反馈
    async submitFeedback() {
      // 校验反馈内容是否为空
      if (!this.feedbackContent) {
        uni.showToast({
          title: '请填写反馈内容',
          icon: 'none',
        });
        return;
      }
	  uni.showLoading({
	  	title: '提交中'
	  });
      // 构造反馈数据
      const feedbackData = {
		userid: store.userInfo._id,
        type: this.feedbackTypes[this.selectedTypeIndex], // 反馈类型
        content: this.feedbackContent, // 反馈内容
        contact: this.contactInfo, // 联系方式
        timestamp: new Date().toISOString(), // 提交时间
      };

      try {
        // 调用云函数 SubmitFeedback
        const res = await uniCloud.callFunction({
          name: 'SubmitFeedback',
          data: feedbackData,
        });

        // 提交成功提示
		if(res.result.success){
        uni.showToast({
          title: res.message,
          icon: 'success',
        });
		uni.switchTab({
			url: '/pages/MyPage/MyPage'
		});
	}    
		else{
		uni.showToast({
		  title: res.message,
		  icon: 'success',
		});
		}
        // 清空表单
        this.feedbackContent = '';
        this.contactInfo = '';
        this.selectedTypeIndex = 0;
      } catch (error) {
        // 提交失败提示
        uni.showToast({
          title: '提交失败，请重试',
          icon: 'none',
        });
        console.error('提交反馈失败:', error);
      } finally{
		  uni.hideLoading();
	  }
    },
  },
};
</script>

<style>
.feedback-container {
  padding: 20px;
}

.navbar {
  text-align: center;
  padding: 20px 0;
}

.navbar-title {
  font-size: 18px;
  font-weight: bold;
}

.form-item {
  margin-bottom: 20px;
}

.label {
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
  display: block;
}

.picker {
  border: 1px solid #ccc;
  padding: 10px;
  border-radius: 4px;
}

.textarea {
  width: 100%;
  height: 150px;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 10px;
  font-size: 14px;
}

.input {
  width: 100%;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 10px;
  font-size: 14px;
}

.submit-btn {
  background-color: #007aff;
  color: #fff;
  text-align: center;
  padding: 12px;
  border-radius: 4px;
  margin-top: 20px;
}

.submit-btn text {
  font-size: 16px;
}
</style>