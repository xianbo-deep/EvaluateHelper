<template>
  <view class="container">
    <!-- 输入手机号 -->
    <input type="tel" 
           placeholder="请输入手机号" 
           maxlength="11"
           class="input-field" 
           v-model="phone" />

    <!-- 输入密码 -->
    <view class="password-container">
      <input :type="passwordVisible ? 'text' : 'password'" 
             placeholder="请输入密码" 
             class="input-field" 
             v-model="password" />
    </view>
    
    <!-- 登录按钮 -->
    <view @click="submit" class="login-btn">登录</view>

    <!-- 微信登录 -->
    <view class="login-btn" @click="weixinLogin">微信登录</view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      phone: '',  // 存储手机号
      password: '',  // 存储密码
      passwordVisible: false,  // 控制密码是否可见
    };
  },
  methods: {

    // 微信登录占位功能
    weixinLogin() {
      uni.showToast({
        title: '微信登录功能暂未实现',
        icon: 'none'
      });
    },

    // 登录提交
    async submit() {
      if (!this.phone || !this.password) {
        uni.showToast({
          title: '手机号或密码不能为空',
          icon: 'none'
        });
        return; // 如果手机号或密码为空，阻止提交
      }

      try {
        const res = await uniCloud.callFunction({
          name: 'Login',
          data: {
            phone: this.phone,
            password: this.password
          },
        });

        if (res.result.code === 0) {
          uni.showToast({
            title: res.result.message,
            icon: "none"
          });
          uni.switchTab({
            url: '/pages/HomePage/HomePage'
          });
        } else if (res.result.code === 1) {
          uni.showToast({
            title: res.result.message,
            icon: "none"
          });
        }
		 else if (res.result.code === 2) {
		   uni.showToast({
		     title: res.result.message,
		     icon: "none"
		   });
		 }else {
          uni.showToast({
            title: '系统异常，请稍后再试',
            icon: "none"
          });
          console.error("系统异常");
        }
      } catch (error) {
        uni.showToast({
          title: '网络请求失败，请稍后再试',
          icon: 'none'
        });
        console.error(error);
      }
    }
  },
}
</script>

<style>
.container {
  padding: 20px;
}

.input-field {
  width: 100%;
  height: 40px;
  margin-bottom: 10px;
  padding-left: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.password-container {
  position: relative;
}

.eye-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
}

.login-btn {
  text-align: center;
  margin-top: 20px;
  padding: 10px;
  background-color: #1aad19;
  color: white;
  border-radius: 5px;
  cursor: pointer;
}
</style>
