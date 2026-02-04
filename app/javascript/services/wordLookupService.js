/**
 * 全局单词查询服务
 * 提供统一的单词查询接口，支持全局事件机制
 */

/**
 * 查询单词
 * @param {string} word - 要查询的单词
 * @param {boolean} addToHistory - 是否添加到历史记录
 */
function lookupWord(word, addToHistory = false) {
  if (!word || typeof word !== 'string') {
    console.warn('无效的单词:', word);
    return;
  }

  try {
    // 触发全局单词查询事件
    const event = new CustomEvent('word-lookup:query', {
      detail: { word, addToHistory }
    });
    document.dispatchEvent(event);
  } catch (error) {
    console.error('单词查询失败:', error);
  }
}

// 挂载到全局
window.lookupWord = lookupWord;

// 如果需要模块导出（可选）
export { lookupWord };
