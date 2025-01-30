<template>
  <view class="tutorial-container">
    <!-- 顶部标题区域 -->
    <view class="header">
      <text class="main-title">主播成长指南</text>
      <text class="sub-title">专业的直播技能提升平台</text>
    </view>

    <!-- 导航标签 -->
    <scroll-view class="nav-tabs" scroll-x="true" show-scrollbar="false">
      <view 
        v-for="(tab, index) in tabs" 
        :key="index"
        class="tab-item"
        :class="{ 'active': currentTab === index }"
        @tap="switchTab(index)"
      >
        {{ tab }}
      </view>
    </scroll-view>

    <!-- 内容区域 -->
    <scroll-view class="content-area" scroll-y="true">
      <!-- 推荐书籍区域 -->
      <view v-if="currentTab === 0" class="section">
        <view 
          v-for="(book, index) in books" 
          :key="index"
          class="resource-card book-card"
        >
          <view class="card-cover" :style="{ backgroundColor: book.color }">
            <text class="book-emoji">{{ book.emoji }}</text>
          </view>
          <view class="card-content">
            <text class="card-title">{{ book.title }}</text>
            <text class="card-desc">{{ book.description }}</text>
            <view class="card-tags">
              <text 
                v-for="(tag, tagIndex) in book.tags" 
                :key="tagIndex" 
                class="tag"
              >
                {{ tag }}
              </text>
            </view>
          </view>
        </view>
      </view>

      <!-- 话术技巧区域 -->
      <view v-if="currentTab === 1" class="section">
        <view 
          v-for="(script, index) in scripts" 
          :key="index"
          class="resource-card script-card"
        >
          <view class="card-header">
            <text class="scenario-label">{{ script.scenario }}</text>
          </view>
          <view class="card-content">
            <text class="script-title">示例话术：</text>
            <text class="script-content">{{ script.content }}</text>
            <view class="tips-section">
              <text class="tips-title">要点：</text>
              <view 
                v-for="(tip, tipIndex) in script.tips" 
                :key="tipIndex"
                class="tip-item"
              >
                <text class="tip-bullet">•</text>
                <text class="tip-text">{{ tip }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 表情管理区域 -->
      <view v-if="currentTab === 2" class="section">
        <view 
          v-for="(expression, index) in expressions" 
          :key="index"
          class="resource-card expression-card"
        >
          <view class="expression-header">
            <text class="expression-title">{{ expression.title }}</text>
            <text class="expression-emoji">{{ expression.emoji }}</text>
          </view>
          <view class="card-content">
            <text class="expression-desc">{{ expression.description }}</text>
            <view class="do-dont-section">
              <view class="do-section">
                <text class="section-title">推荐：</text>
                <view 
                  v-for="(item, itemIndex) in expression.dos" 
                  :key="itemIndex"
                  class="list-item"
                >
                  <text class="check-icon">✓</text>
                  <text class="item-text">{{ item }}</text>
                </view>
              </view>
              <view class="dont-section">
                <text class="section-title">避免：</text>
                <view 
                  v-for="(item, itemIndex) in expression.donts" 
                  :key="itemIndex"
                  class="list-item"
                >
                  <text class="cross-icon">✕</text>
                  <text class="item-text">{{ item }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      currentTab: 0,
      tabs: ['推荐书籍', '话术技巧', '表情管理'],
      books: [
        {
          title: '直播带货话术指南',
          description: '系统性讲解直播间互动技巧和话术构建方法',
          emoji: '📚',
          color: '#FFE1E6',
          tags: ['带货技巧', '互动话术', '场景案例']
        },
        {
          title: '直播间气氛调节艺术',
          description: '教你如何活跃直播间氛围，提升观众粘性',
          emoji: '🎭',
          color: '#E1F8FF',
          tags: ['氛围营造', '互动技巧', '情绪管理']
        },
        {
          title: '直播间危机公关手册',
          description: '应对直播间突发状况的专业指南',
          emoji: '🛟',
          color: '#FFE8D6',
          tags: ['危机处理', '应急预案', '案例分析']
        }
      ],
      scripts: [
        {
          scenario: '开场互动',
          content: '亲爱的宝宝们，终于等到你们来啦！今天给大家带来超多优惠福利，准备好抢购了吗？',
          tips: [
            '语气要充满活力和期待感',
            '设置悬念引发观众好奇',
            '强调优惠信息增加吸引力'
          ]
        },
        {
          scenario: '商品介绍',
          content: '这款产品是我自己每天都在用的，特别是它的【核心卖点】，用了之后真的会惊艳到你们！',
          tips: [
            '强调个人使用体验',
            '突出产品核心优势',
            '用具体数据支撑观点'
          ]
        }
      ],
      expressions: [
        {
          title: '微笑表情管理',
          emoji: '😊',
          description: '专业的微笑能让观众感受到亲和力和信任感',
          dos: [
            '眼角微微上扬，展现真诚',
            '保持自然的面部放松'
          ],
          donts: [
            '过度夸张的假笑',
            '表情僵硬不自然'
          ]
        },
        {
          title: '惊喜表情运用',
          emoji: '😲',
          description: '合适的惊喜表情能调动直播间的互动氛围',
          dos: [
            '眼神富有活力',
            '配合适当的肢体语言'
          ],
          donts: [
            '表情过于夸张',
            '频繁重复同一表情'
          ]
        }
      ]
    }
  },
  methods: {
    switchTab(index) {
      this.currentTab = index;
    }
  }
}
</script>

<style>
.tutorial-container {
  min-height: 100vh;
  background: #f8fafc;
  padding: 40rpx 20rpx;
}

.header {
  padding: 40rpx 30rpx;
  text-align: center;
}

.main-title {
  font-size: 44rpx;
  font-weight: bold;
  color: #1a1a1a;
  margin-bottom: 16rpx;
  display: block;
}

.sub-title {
  font-size: 28rpx;
  color: #666;
  display: block;
}

.nav-tabs {
  display: flex;
  padding: 20rpx 30rpx;
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 30rpx;
  white-space: nowrap;
}

.tab-item {
  display: inline-block;
  padding: 16rpx 40rpx;
  font-size: 28rpx;
  color: #666;
  border-radius: 30rpx;
  margin-right: 20rpx;
  transition: all 0.3s;
}

.tab-item.active {
  background: #6366f1;
  color: #fff;
  font-weight: 500;
}

.content-area {
  height: calc(100vh - 300rpx);
}

.section {
  padding: 20rpx;
}

.resource-card {
  background: #fff;
  border-radius: 20rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.card-cover {
  height: 160rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.book-emoji {
  font-size: 80rpx;
}

.card-content {
  padding: 30rpx;
}

.card-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #1a1a1a;
  margin-bottom: 16rpx;
  display: block;
}

.card-desc {
  font-size: 28rpx;
  color: #666;
  line-height: 1.5;
  margin-bottom: 20rpx;
  display: block;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.tag {
  font-size: 24rpx;
  color: #6366f1;
  background: rgba(99, 102, 241, 0.1);
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
}

.script-card {
  border-left: 8rpx solid #6366f1;
}

.card-header {
  padding: 20rpx 30rpx;
  background: rgba(99, 102, 241, 0.1);
}

.scenario-label {
  font-size: 28rpx;
  color: #6366f1;
  font-weight: 500;
}

.script-title {
  font-size: 28rpx;
  color: #1a1a1a;
  font-weight: 500;
  margin-bottom: 16rpx;
  display: block;
}

.script-content {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
  margin-bottom: 30rpx;
  display: block;
}

.tips-section {
  background: #f8fafc;
  padding: 20rpx;
  border-radius: 12rpx;
}

.tips-title {
  font-size: 28rpx;
  color: #1a1a1a;
  font-weight: 500;
  margin-bottom: 16rpx;
  display: block;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12rpx;
}

.tip-bullet {
  color: #6366f1;
  margin-right: 12rpx;
}

.tip-text {
  font-size: 26rpx;
  color: #666;
  flex: 1;
}

.expression-card {
  border-top: 8rpx solid #6366f1;
}

.expression-header {
  padding: 30rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 2rpx solid #f0f0f0;
}

.expression-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #1a1a1a;
}

.expression-emoji {
  font-size: 48rpx;
}

.expression-desc {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
  margin-bottom: 30rpx;
  display: block;
}

.do-dont-section {
  background: #f8fafc;
  padding: 20rpx;
  border-radius: 12rpx;
}

.section-title {
  font-size: 28rpx;
  color: #1a1a1a;
  font-weight: 500;
  margin-bottom: 16rpx;
  display: block;
}

.list-item {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}

.check-icon {
  color: #10b981;
  margin-right: 12rpx;
}

.cross-icon {
  color: #ef4444;
  margin-right: 12rpx;
}

.item-text {
  font-size: 26rpx;
  color: #666;
  flex: 1;
}
</style>