// cloudfunctions/autoGenerateCards/index.js
'use strict';
// 生成指定长度的随机字符串
function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 生成卡号
function generateCardId() {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `CARD${timestamp}${random}`;
}

// 根据卡类型生成卡密
function generateCardCode(cardType) {
  switch (cardType) {
    case 'daily':
      return generateRandomString(32);
    case 'monthly':
      return generateRandomString(48);
    default:
      throw new Error('Invalid card type');
  }
}

// 获取卡类别前缀
function getCategoryPrefix(cardCategory) {
  switch (cardCategory) {
    case 'streamer':
      return 'S';  // 主播卡
    case 'review':
      return 'R';  // 测评卡
    case 'tutorial':
      return 'T';  // 教程卡
    case 'enterprise':
      return 'E';  // 企业卡
    default:
      throw new Error('Invalid card category');
  }
}

// 生成指定类型、类别和数量的卡密
async function generateCards(db, cardType, cardCategory, value, count) {
  try {
    const collection = db.collection('Card');
    const cards = [];
    const existingCards = new Set();
    
    const categoryPrefix = getCategoryPrefix(cardCategory);
    
    for (let i = 0; i < count; i++) {
      let cardCode;
      do {
        // 在卡密前添加类别前缀以便识别
        cardCode = `${categoryPrefix}-${generateCardCode(cardType)}`;
      } while (existingCards.has(cardCode));
      
      existingCards.add(cardCode);
      
      cards.push({
        cardId: generateCardId(),
        cardCode: cardCode,
        cardType: cardType,
        cardCategory: cardCategory,
        value: value,
        status: 'unused',
        createTime: Date.now()
      });
    }
    
    // 分批添加数据，避免一次性添加过多记录
    const batchSize = 100;
    let insertedCount = 0;
    
    for (let i = 0; i < cards.length; i += batchSize) {
      const batch = cards.slice(i, i + batchSize);
      const result = await collection.add(batch);
      insertedCount += result.insertedCount || batch.length;
    }
    
    console.log(`Generated ${insertedCount} ${cardCategory} ${cardType} cards`);
    return insertedCount;
  } catch (error) {
    console.error(`Error generating ${cardCategory} ${cardType} cards:`, error);
    throw error;
  }
}

// 检查卡密库存并生成
async function checkAndGenerateCards(db, cardType, cardCategory) {
  const collection = db.collection('Card');
  
  // 获取未使用的特定类型和类别的卡密数量
  const count = await collection.where({
    cardType: cardType,
    cardCategory: cardCategory,
    status: 'unused'
  }).count();
  
  console.log(`${cardCategory} ${cardType} cards count:`, count.total);
  
  // 如果数量少于50，则生成新卡密
  if (count.total < 50) {
    const needGenerate = 200 - count.total; // 补充到200个
    
    // 设置不同类型卡密的默认面值
    const defaultValues = {
      'daily': 7,   // 7天
      'monthly': 1  // 1个月
    };
    
    await generateCards(db, cardType, cardCategory, defaultValues[cardType], needGenerate);
  }
}

// 检查任务是否启用
async function checkTaskEnabled(db, functionName) {
  try {
    // 查询TimeConfig表，检查该云函数是否被启用
    const { data } = await db.collection('TimeConfig')
      .where({
        functionName: functionName,
        enabled: true
      })
      .limit(1)
      .get();
    
    if (data && data.length > 0) {
      // 更新最后执行时间
      await db.collection('TimeConfig')
        .where({
          functionName: functionName
        })
        .update({
          updateTime: Date.now()
        });
      return true;
    }
    
    console.log(`Task ${functionName} is disabled, skipping execution`);
    return false;
  } catch (error) {
    console.error('Error checking task status:', error);
    // 如果检查出错，默认允许执行以确保业务连续性
    return true;
  }
}

// 云函数入口
exports.main = async (event, context) => {
  try {
    console.log('Starting auto generation check at:', new Date().toISOString());
    
    const db = uniCloud.database();
    const functionName = 'GenerateCards';
    
    // 检查任务是否启用
    const isEnabled = await checkTaskEnabled(db, functionName);
    
    // 如果任务被禁用，则跳过执行
    if (!isEnabled) {
      return {
        success: true,
        message: 'Task is disabled, execution skipped',
        executed: false
      };
    }
    
    // 获取所有的卡类型和卡类别
    const cardTypes = ['daily', 'monthly']; // 移除次卡，只保留日卡和月卡
    const cardCategories = ['streamer', 'review', 'tutorial', 'enterprise'];
    
    // 为每种类型和类别组合检查并生成卡密
    const tasks = [];
    
    for (const cardType of cardTypes) {
      for (const cardCategory of cardCategories) {
        tasks.push(checkAndGenerateCards(db, cardType, cardCategory));
      }
    }
    
    // 并行执行所有检查和生成任务
    await Promise.all(tasks);
    
    return {
      success: true,
      message: 'Card check and generation completed successfully',
      executed: true
    };
  } catch (error) {
    console.error('Error in auto generation:', error);
    return {
      success: false,
      error: error.message,
      executed: true
    };
  }
};