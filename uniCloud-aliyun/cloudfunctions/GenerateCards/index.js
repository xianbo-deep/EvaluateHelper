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
    case 'times':
      return generateRandomString(16);
    case 'daily':
      return generateRandomString(32);
    case 'monthly':
      return generateRandomString(48);
    default:
      throw new Error('Invalid card type');
  }
}
// 生成指定类型和数量的卡密
async function generateCards(db, cardType, value, count) {
  try {
    const collection = db.collection('Card');
    const cards = [];
    const existingCards = new Set();
    
    for (let i = 0; i < count; i++) {
      let cardCode;
      do {
        cardCode = generateCardCode(cardType);
      } while (existingCards.has(cardCode));
      
      existingCards.add(cardCode);
      
      cards.push({
        cardId: generateCardId(),
        cardCode: cardCode,
        cardType: cardType,
        value: value,
        status: 'unused',
        createTime: Date.now()
      });
    }
    
    const result = await collection.add(cards);
    console.log(`Generated ${result.insertedCount} ${cardType} cards`);
    return result.insertedCount;
  } catch (error) {
    console.error(`Error generating ${cardType} cards:`, error);
    throw error;
  }
}
// 检查卡密库存并生成
async function checkAndGenerateCards(db, cardType) {
  const collection = db.collection('Card');
  
  // 获取未使用的卡密数量
  const count = await collection.where({
    cardType: cardType,
    status: 'unused'
  }).count();
  
  console.log(`${cardType} cards count:`, count.total);
  
  // 如果数量少于100，则生成新卡密
  if (count.total < 100) {
    const needGenerate = 1000 - count.total; // 补充到1000个
    
    // 设置不同类型卡密的默认面值
    const defaultValues = {
      'times': 10,  // 10次
      'daily': 1,   // 1天
      'monthly': 1  // 1个月
    };
    
    await generateCards(db, cardType, defaultValues[cardType], needGenerate);
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
    
    // 检查所有类型的卡密
    await Promise.all([
      checkAndGenerateCards(db, 'times'),
      checkAndGenerateCards(db, 'daily'),
      checkAndGenerateCards(db, 'monthly')
    ]);
    
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