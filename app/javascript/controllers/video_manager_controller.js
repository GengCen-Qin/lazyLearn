import { Controller } from "@hotwired/stimulus";
import { WordLookup } from "controllers/word_lookup";

/**
 * 视频管理控制器
 * 处理单词查询功能
 */
export default class extends Controller {
  static targets = [
    "currentTime",
    "currentSubtitleIndex",
    "subtitleCount",
    "message",
  ];

  connect() {
    this.wordLookup = new WordLookup();
    this.wordLookup.setupWordLookup();
  }

  // ========================================
  // 单词查询相关方法
  // ========================================

  showPopupContainer() {
    this.wordLookup.showPopupContainer();
  }

  hidePopupContainer() {
    this.wordLookup.hidePopupContainer();
  }

  /**
   * 异步查询单词释义
   * 发送请求到后端API，创建多层弹窗显示释义
   */
  async lookupWord(word) {
    await this.wordLookup.lookupWord(word);
  }

  getCSRFToken() {
    return this.wordLookup.getCSRFToken();
  }

  // ========================================
  // 多层弹窗管理相关方法
  // ========================================

  createPopupLayer(word, sourceLayer = 0, showImmediately = true) {
    return this.wordLookup.createPopupLayer(word, sourceLayer, showImmediately);
  }

  /**
   * 关闭指定的弹窗
   * 移除DOM元素并从活动列表中删除
   */
  closePopup(popupId) {
    return this.wordLookup.closePopup(popupId);
  }

  /**
   * 关闭最顶层的弹窗
   * 用于ESC键和点击外部区域时的处理
   */
  closeTopPopup() {
    this.wordLookup.closeTopPopup();
  }

  /**
   * 显示弹窗错误状态
   * 当查询失败或未找到单词时显示错误信息
   */
  showPopupError(popupId, message) {
    this.wordLookup.showPopupError(popupId, message);
  }

  /**
   * 显示弹窗（从隐藏状态到可见状态）
   * 使用淡入动画效果
   */
  revealPopup(popupId) {
    this.wordLookup.revealPopup(popupId);
  }

  showPopupDefinition(popupId, wordData, sourceWord) {
    const processDef = (text, skipEnglish = false) =>
      this.wordLookup.processDefinitionText(text, skipEnglish, this.escapeHtml);
    this.wordLookup.showPopupDefinition(
      popupId,
      wordData,
      sourceWord,
      processDef,
      this,
    );
  }

  addPopupWordClickListeners(popupId) {
    this.wordLookup.addPopupWordClickListeners(popupId, this);
  }

  disconnect() {
    this.wordLookup.disconnect();
  }
}
