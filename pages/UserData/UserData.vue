<template>
  <view class="profile-container">
    <view class="avatar-section">
      <view class="avatar-wrapper" @tap=updateAvatar>
        <image class="avatar" :src="avatar || '/static/default-avatar.png'" mode="aspectFill"></image>
        
      </view>
    </view>

    <view class="info-list">
      <view class="info-item" @click="editUsername">
        <text class="item-label">昵称</text>
        <view class="item-content">
          <text class="item-value">{{formData.username || '未设置'}}</text>
          <text class="iconfont icon-right"></text>
        </view>
      </view>

      <view class="info-item" @click="editEmail">
        <text class="item-label">邮箱</text>
        <view class="item-content">
          <text class="item-value">{{formData.email || '未绑定'}}</text>
          <text class="iconfont icon-right"></text>
        </view>
      </view>

      <view class="info-item" @click="editBio">
        <text class="item-label">简介</text>
        <view class="item-content">
          <text class="item-value">{{formData.bio || '一句话介绍自己'}}</text>
          <text class="iconfont icon-right"></text>
        </view>
      </view>

      <view class="info-item" @click="editBirthday">
        <text class="item-label">生日</text>
        <view class="item-content">
          <text class="item-value">{{formData.birthday || '选择生日'}}</text>
          <text class="iconfont icon-right"></text>
        </view>
      </view>
    </view>
  </view>

  <!-- 编辑弹窗 -->
  <uni-popup ref="editPopup" type="bottom">
    <view class="popup-content">
      <view class="popup-header">
        <text class="cancel" @click="closePopup">取消</text>
        <text class="title">{{popupTitle}}</text>
        <text class="confirm" @click="confirmEdit" :class="{disabled: !isInputValid}">确定</text>
      </view>
      
      <view class="popup-body">
        <input 
          v-if="!isDatePicker"
          class="edit-input"
          v-model="editValue"
          :placeholder="placeholder"
          :type="editType === 'email' ? 'email' : 'text'"
        />
        <picker
          v-else
          mode="date"
          :value="editValue"
          start="1900-01-01"
          :end="currentDate"
          @change="onDateChange"
          class="date-picker"
        >
          <view class="picker-text">{{editValue || '请选择日期'}}</view>
        </picker>
        <text v-if="inputError" class="error-text">{{inputError}}</text>
      </view>
    </view>
  </uni-popup>
</template>

<script>
import { store } from '/uni_modules/uni-id-pages/common/store.js';
export default {
  data() {
    return {
      formData: {
        username: '',
        email: '',
        bio: '',
        birthday: ''
      },
	  avatar: '',
      editType: '',
      editValue: '',
      inputError: '',
      isDatePicker: false,
      currentDate: new Date().toISOString().split('T')[0]
    }
  },
  computed: {
    popupTitle() {
      const titles = {
        username: '修改昵称',
        email: '修改邮箱',
        bio: '修改简介',
        birthday: '选择生日'
      }
      return titles[this.editType] || ''
    },
    placeholder() {
      const placeholders = {
        username: '请输入昵称',
        email: '请输入邮箱',
        bio: '一句话介绍自己'
      }
      return placeholders[this.editType] || ''
    },
    isInputValid() {
      if (this.editType === 'email') {
        return this.validateEmail(this.editValue)
      }
      return this.editValue.trim().length > 0
    }
  },
  onShow(){
	  const cachedUserInfo = uni.getStorageSync('${userId}_userdata');
	  const cachedAvatar = uni.getStorageSync('${userId}_avatar');
	  if (cachedUserInfo) {
	      this.formData = cachedUserInfo; // 如果缓存存在，直接使用
		  uni.setStorageSync('${userId}_nickname',this.formData.username);
	    }
	  if(cachedAvatar){
		  this.avatar = cachedAvatar;
	  }
  },
  async onLoad(){
	  const userId = store.userInfo._id;
   const cachedUserInfo = uni.getStorageSync(`${userId}_userdata`);
   console.log(cachedUserInfo)
   const cachedAvatar = uni.getStorageSync(`${userId}_avatar`);
   if (cachedUserInfo || cachedAvatar) {
       this.formData = cachedUserInfo; // 如果缓存存在，直接使用
	   this.avatar = cachedAvatar;
     } else {
       // 如果缓存不存在，调用云函数获取用户信息
       try {
         const res = await uniCloud.callFunction({
           name: 'GetUser', // 云函数名称
           data: {
             uid: store.userInfo._id, // 传递用户 UID
           },
         });
   
         if (res.result && res.result.code == 0) {
         this.formData.username = res.result.data.username; // 更新用户数据
  		 this.formData.email = res.result.data.email; 
  		 this.formData.birthday = res.result.data.birthday; 
  		 this.formData.bio = res.result.data.bio; 
		 this.avatar = res.result.data.avatarUrl;
           uni.setStorageSync('${userId}_userdata', this.formData); // 将用户数据存入缓存
		   uni.setStorageSync('${userId}_nickname', this.formData.username); // 将用户数据存入缓存
		   uni.setStorageSync('${userId}_avatar', this.avatar); // 将用户数据存入缓存
         } else {
           console.error('获取用户信息失败:', res.result.message || '未知错误');
         }
       } catch (error) {
         console.error('云函数调用失败:', error);
       }
     }
  },
  methods: {
    validateEmail(email) {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return regex.test(email)
    },
    editUsername() {
      this.openEditor('username')
    },
    editEmail() {
      this.openEditor('email')
    },
    editBio() {
      this.openEditor('bio')
    },
    editBirthday() {
      this.openEditor('birthday', true)
    },
    openEditor(type, isDate = false) {
      this.editType = type
      this.editValue = this.formData[type]
      this.inputError = ''
      this.isDatePicker = isDate
      this.$refs.editPopup.open()
    },
    closePopup() {
      this.$refs.editPopup.close()
      this.isDatePicker = false
    },
    onDateChange(e) {
      this.editValue = e.detail.value
    },
   async confirmEdit() {
     if (!this.isDatePicker && !this.isInputValid) return
     const userId = store.userInfo._id;
     try {
       if (this.editType === 'email' && !this.validateEmail(this.editValue)) {
         this.inputError = '请输入正确的邮箱格式'
         return
       }
       uni.showLoading({
       		  title: '提交中'
       });
	   
       // 调用云函数更新用户信息
       const res = await uniCloud.callFunction({
         name: 'updateUserProfile',
         data: {
			uid: store.userInfo._id,
           [this.editType]: this.editValue
         }
       })
       
       if (res.result.code === 0) {
         this.formData[this.editType] = this.editValue
		 uni.setStorageSync('${userId}_userdata', this.formData); // 更新缓存
		 uni.setStorageSync('${userId}_nickname', this.formData.username); // 更新缓存
         this.closePopup()
         uni.showToast({
           title: '修改成功',
           icon: 'success'
         })
       } else {
         throw new Error(res.result.message)
       }
     } catch (error) {
       uni.showToast({
         title: error.message || '修改失败，请重试',
         icon: 'error'
       })
     } finally{
		 uni.hideLoading();
	 }
   },
   async updateAvatar() {
     try {
	   uni.showLoading({
		  title: '提交中'
	   });
       const uid = store.userInfo._id;
   
       // 选择图片
       const chooseImageResult = await new Promise((resolve, reject) => {
         uni.chooseImage({
           count: 1, // 限制只能选择一张图片
           sizeType: ['original', 'compressed'], // 支持原图和压缩图
           success: resolve,
           fail: (err) =>{
			   if(err.errMsg.includes('cancel')){
				   uni.showToast({
				   	title: '已取消操作',
					icon: 'none'
				   });
			   }
			reject(err);
		   }
         });
       });
   
       const filePath = chooseImageResult.tempFilePaths[0]; // 获取用户选择的图片路径
   
       // 上传图片到云存储
       const uploadResult = await uniCloud.uploadFile({
         filePath: filePath,
         cloudPath: `Avatar/${uid}-${Date.now()}.png`,
		 cloudPathAsRealPath: true// 云存储路径
       });
   
       const fileUrl = uploadResult.fileID; // 获取上传后的文件 URL
   
       // 调用云函数更新用户信息
       const updateResult = await uniCloud.callFunction({
         name: 'updateUserProfile',
         data: {
           uid: uid,
           avatar: fileUrl // 将头像 URL 发送到云函数
         }
       });
   
       // 检查云函数返回结果
       if (updateResult.result && updateResult.result.success) {
         // 更新前端显示的头像
         this.avatar = fileUrl;
         uni.setStorageSync('${userId}_avatar', this.avatar); // 更新缓存
   
         uni.showToast({
           title: '头像更新成功',
           icon: 'success'
         });
       } else {
         throw new Error(updateResult.result.message || '头像更新失败');
       }
     } catch (error) {
       if (!error.errMsg || !error.errMsg.includes('cancel')) {
             console.log('用户取消操作')
        }
     } finally{
		uni.hideLoading();
	 }
   }
  }
}
</script>

<style>
.profile-container {
  min-height: 100vh;
  background: #fff;
}

.avatar-section {
  padding: 60rpx 0;
  display: flex;
  justify-content: center;
  background: #fff;
}

.avatar-wrapper {
  position: relative;
  width: 160rpx;
  height: 160rpx;
}

.avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 6rpx solid #f5f5f5;
}


.info-list {
  margin-top: 20rpx;
  background: #fff;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx 40rpx;
  border-bottom: 2rpx solid #f5f5f5;
}

.item-label {
  color: #333;
  font-size: 32rpx;
}

.item-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10rpx;
}

.item-value {
  color: #333;
  font-size: 32rpx;
  margin-right: 20rpx;
}

.icon-right {
  color: #ccc;
  font-size: 32rpx;
}

/* 弹窗样式 */
.popup-content {
  background: #fff;
  border-radius: 30rpx 30rpx 0 0;
  overflow: hidden;
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  border-bottom: 2rpx solid #f5f5f5;
}

.popup-header .title {
  color: #333;
  font-size: 32rpx;
  font-weight: 500;
}

.popup-header .cancel,
.popup-header .confirm {
  color: #8B5CF6;
  font-size: 32rpx;
}

.popup-header .disabled {
  opacity: 0.5;
}

.popup-body {
  padding: 40rpx;
}

.edit-input {
  width: 100%;
  height: 88rpx;
  background: #f9f9f9;
  border: 2rpx solid #f0f0f0;
  border-radius: 16rpx;
  padding: 0 30rpx;
  color: #333;
  font-size: 32rpx;
}

.date-picker {
  width: 100%;
  height: 88rpx;
  background: #f9f9f9;
  border: 2rpx solid #f0f0f0;
  border-radius: 16rpx;
  padding: 0 30rpx;
  display: flex;
  align-items: center;
}

.picker-text {
  color: #333;
  font-size: 32rpx;
}

.error-text {
  color: #EF4444;
  font-size: 24rpx;
  margin-top: 16rpx;
}
</style>