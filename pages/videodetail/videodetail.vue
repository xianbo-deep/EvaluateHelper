<template>
	<view class="container">
		<view v-if="videoUrl" class="video-container">
			<video 
				:src="videoUrl"
				autoplay
				controls
				poster="/static/video-poster.png"
				object-fit="contain"
				@error="handleVideoError"
				class="video-player"
			></video>
		</view>
		<view v-else-if="isLoading" class="loading-container">
			<text class="loading-text">视频加载中...</text>
		</view>
		<view v-else class="error-container">
			<text class="error-text">{{ errorMessage || '视频获取失败，请稍后重试' }}</text>
			<button type="primary" size="mini" @click="retryFetch" class="retry-btn">重试</button>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			recordId: '',
			videoUrl: '',
			isLoading: true,
			errorMessage: '',
			retryCount: 0
		}
	},
	onLoad(options) {
		console.log('视频ID:', options.id);
		if (!options.id) {
			this.errorMessage = '无效的视频ID';
			this.isLoading = false;
			return;
		}
		
		this.recordId = options.id;
		this.fetchVideo(this.recordId);
	},
	methods: {
		async fetchVideo(recordId) {
			this.isLoading = true;
			this.errorMessage = '';
			
			try {
				// 第一个查询获取 fileId
				const result = await uniCloud.database().collection('AssessmentRecord')
					.where({ recordId: Number(recordId) })
					.field('fileId')
					.get();
				
				// 确保有数据并获取 fileId
				if (result.result && result.result.data && result.result.data.length > 0) {
					const fileId = result.result.data[0].fileId;
					
					if (!fileId) {
						throw new Error('未找到视频文件ID');
					}
					
					// 使用获取到的 fileId 进行第二个查询
					const res = await uniCloud.database().collection('FileStorage')
						.where({ fileId: Number(fileId) })
						.field('fileUrl')
						.get();
					
					if (res.result && res.result.data && res.result.data.length > 0) {
						this.videoUrl = res.result.data[0].fileUrl;
						
						if (!this.videoUrl) {
							throw new Error('视频URL为空');
						}
					} else {
						throw new Error('未找到视频文件信息');
					}
				} else {
					throw new Error('未找到相关记录');
				}
			} catch (error) {
				console.error('视频获取失败:', error);
				this.errorMessage = error.message || '视频获取失败';
				this.videoUrl = '';
			} finally {
				this.isLoading = false;
			}
		},
		handleVideoError(error) {
			console.error('视频播放错误:', error);
			this.errorMessage = '视频播放失败，请检查网络连接';
			this.videoUrl = '';
		},
		retryFetch() {
			if (this.retryCount < 3) {
				this.retryCount++;
				this.fetchVideo(this.recordId);
			} else {
				uni.showToast({
					title: '多次尝试失败，请稍后再试',
					icon: 'none'
				});
			}
		}
	}
}
</script>

<style>
.container {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100vh;
	background-color: #f5f5f5;
}

.video-container {
	width: 100%;
	height: 420rpx;
	background-color: #000;
}

.video-player {
	width: 100%;
	height: 100%;
}

.loading-container, .error-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 420rpx;
	width: 100%;
	background-color: #f0f0f0;
}

.loading-text {
	font-size: 28rpx;
	color: #666;
}

.error-text {
	font-size: 28rpx;
	color: #ff4d4f;
	margin-bottom: 20rpx;
	text-align: center;
}

.retry-btn {
	margin-top: 20rpx;
}
</style>