import { Controller } from "@hotwired/stimulus";
import { VideoControls } from "controllers/video_controls";
import { SubtitleManager } from "controllers/subtitle_manager";
import { WordLookup } from "controllers/word_lookup";
import { Utils } from "controllers/utils";

/**
 * 视频字幕播放器控制器
 * 协调视频控制、字幕管理、单词查询和工具模块
 */
export default class extends Controller {
  static targets = [
    "video",
    "videoInput",
    "currentTime",
    "currentSubtitleIndex",
    "jsonInput",
    "subtitleList",
    "subtitleCount",
    "message",
  ];

  static values = {
    currentVideoUrl: String,
    subtitles: Array,
    currentIndex: { type: Number, default: -1 },
  };

  connect() {
    this.videoControls = new VideoControls(this.videoTarget);
    this.subtitleManager = new SubtitleManager();
    this.wordLookup = new WordLookup();
    this.utils = new Utils();

    this.videoControls.initializePlayer();
    this.setupEventListeners();
    this.setupKeyboardShortcuts();
    this.wordLookup.setupWordLookup();

    this.isAutoScrolling = false;
    this.lastScrollTime = 0;
    this.currentPopupWord = null;

    this.loadInitialSubtitles();
  }

  /**
   * 设置视频播放器事件监听器
   */
  setupEventListeners() {
    this.videoControls.setupEventListeners(this);
  }

  /** 设置键盘快捷键 */
  setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT") return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          e.stopPropagation();
          this.togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          e.stopPropagation();
          this.handleLeftKey();
          break;
        case "ArrowRight":
          e.preventDefault();
          e.stopPropagation();
          this.handleRightKey();
          break;
      }
    });
  }

  /**
   * 处理视频播放错误
   * 显示用户友好的错误信息
   */
  handleVideoError(event) {
    this.utils.showError(
      "视频文件播放失败，请检查文件格式是否支持",
      this.element,
    );
  }

  /**
   * 切换视频播放/暂停状态
   * 兼容Plyr播放器和原生video元素
   */
  togglePlay() {
    this.videoControls.togglePlay();
  }

  /**
   * 处理左箭头键按下事件
   * 如果有字幕则跳转到上一条，否则后退5秒
   */
  handleLeftKey() {
    if (this.subtitlesValue.length > 0) {
      // 有字幕时跳转到上一条
      this.jumpToPrevious();
    } else {
      // 无字幕时后退5秒
      const currentTime = this.getCurrentTime();
      this.seekTo(Math.max(0, currentTime - 5));
    }
  }

  /**
   * 处理右箭头键按下事件
   * 如果有字幕则跳转到下一条，否则前进5秒
   */
  handleRightKey() {
    if (this.subtitlesValue.length > 0) {
      // 有字幕时跳转到下一条
      this.jumpToNext();
    } else {
      // 无字幕时前进5秒
      const currentTime = this.getCurrentTime();
      const duration = this.getDuration();
      this.seekTo(Math.min(duration, currentTime + 5));
    }
  }

  handleTimeUpdate() {
    this.updateStatusBar();
    this.syncSubtitles(this.getCurrentTime());
  }

  seekTo(time) {
    this.videoControls.seekTo(time);
  }

  getCurrentTime() {
    return this.videoControls.getCurrentTime();
  }

  getDuration() {
    return this.videoControls.getDuration();
  }

  /**
   * 渲染字幕列表到UI
   * 为每条字幕创建可点击的行，支持时间跳转和单词查询
   * 将字幕文本中的英文单词设为可点击
   */
  renderSubtitleList() {
    // 委托给subtitleManager处理
    this.subtitleManager.renderSubtitleList(
      this.subtitlesValue,
      this.subtitleListTarget,
      this.utils.formatTime.bind(this.utils),
      this.utils.processSubtitleText.bind(this.utils),
      this.seekToSubtitle.bind(this),
      this.utils.escapeHtml.bind(this.utils), // 传递escapeHtml函数
      this, // handler for word click events
    );
  }
  /**
   * 同步字幕到当前播放时间
   * 根据当前时间找到应该显示的字幕并更新UI
   */
  syncSubtitles(currentTime) {
    this.subtitleManager.syncSubtitles(
      currentTime,
      this.subtitlesValue,
      this.currentIndexValue,
      (newIndex) => {
        this.currentIndexValue = newIndex;
        this.updateActiveSubtitle(); // 更新当前字幕高亮
        this.scrollToCurrentSubtitle(); // 滚动到当前字幕
        this.updateStatusBar(); // 更新状态栏
      },
    );
  }

  /**
   * 手动设置当前字幕索引
   * 用于点击字幕列表时的跳转
   */
  setCurrentSubtitle(index) {
    this.subtitleManager.setCurrentSubtitle(index, (newIndex) => {
      this.currentIndexValue = newIndex;
    });
    this.updateActiveSubtitle(); // 更新当前字幕高亮
    this.scrollToCurrentSubtitle(); // 滚动到当前字幕
    this.updateStatusBar(); // 更新状态栏
  }

  /**
   * 根据当前播放时间查找应该显示的字幕索引
   * 从后往前遍历，找到第一个开始时间小于等于当前时间的字幕
   */
  findCurrentSubtitleIndex(currentTime) {
    return this.subtitleManager.findCurrentSubtitleIndex(
      currentTime,
      this.subtitlesValue,
    );
  }

  /**
   * 更新当前字幕的激活状态
   * 移除所有字幕的active类，为当前字幕添加active类
   */
  updateActiveSubtitle() {
    // 移除所有字幕项的激活状态
    this.subtitleManager.updateActiveSubtitle(this.currentIndexValue);
  }
  /**
   * 滚动到当前激活的字幕位置
   * 使用平滑滚动并防止频繁滚动
   */
  scrollToCurrentSubtitle() {
    this.subtitleManager.scrollToCurrentSubtitle();
  }

  /**
   * 跳转到指定索引的字幕
   * 同时设置视频播放位置和当前字幕索引
   */
  seekToSubtitle(index) {
    if (index >= 0 && index < this.subtitlesValue.length) {
      const subtitle = this.subtitlesValue[index];
      this.seekTo(subtitle.start); // 跳转到字幕开始时间
      this.setCurrentSubtitle(index); // 设置当前字幕索引
    }
  }

  /**
   * 兼容HTML模板的别名方法
   * 处理字幕列表项点击事件
   */
  jumpToSubtitle(event) {
    const index = parseInt(event.currentTarget.dataset.index);
    this.seekToSubtitle(index);
  }

  /**
   * 跳转到上一条字幕
   * 如果已经是第一条，则停在第一条
   */
  jumpToPrevious() {
    if (this.subtitlesValue.length === 0) return;

    this.subtitleManager.jumpToPrevious(
      this.subtitlesValue,
      this.currentIndexValue,
      (targetIndex) => {
        this.seekToSubtitle(targetIndex);
      },
    );
  }

  /**
   * 跳转到下一条字幕
   * 如果已经是最后一条，则停在最后一条
   */
  jumpToNext() {
    if (this.subtitlesValue.length === 0) return;

    this.subtitleManager.jumpToNext(
      this.subtitlesValue,
      this.currentIndexValue,
      (targetIndex) => {
        this.seekToSubtitle(targetIndex);
      },
    );
  }
  updateSubtitleCount() {
    if (this.hasSubtitleCountTarget) {
      this.subtitleCountTarget.textContent = `${this.subtitlesValue.length} 条字幕`;
    }
  }
  // ========================================
  // Status Bar Methods
  // ========================================
  updateStatusBar() {
    this.utils.updateStatusBar(
      this.hasCurrentTimeTarget,
      this.currentTimeTarget,
      this.getCurrentTime.bind(this),
      this.hasCurrentSubtitleIndexTarget,
      this.currentSubtitleIndexTarget,
      this.currentIndexValue,
      this.subtitlesValue,
      this.utils.formatTime.bind(this.utils),
    );
  }
  // ========================================
  // Message Methods
  // ========================================
  showSuccess(message) {
    this.utils.showSuccess(message, this.element);
  }
  showError(message) {
    this.utils.showError(message, this.element);
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
   * 处理字幕文本，将英文单词标记为可点击
   * 使用改进的词法分析来正确处理标点符号和其他字符
   */
  processSubtitleText(text) {
    return this.utils.processSubtitleText(
      text,
      this.utils.escapeHtml.bind(this.utils),
    );
  }
  /**
   * 添加单词点击事件监听器
   * 为所有可点击的英文单词添加查词功能
   */
  addWordClickListeners() {
    // This is now handled by the subtitle manager module
    this.subtitleManager.addWordClickListeners(this);
  }

  /**
   * 异步查询单词释义
   * 发送请求到后端API，创建多层弹窗显示释义
   */
  async lookupWord(word) {
    this.videoControls.pause();
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
    // 使用正确的processDefinitionText方法
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
    // 关闭所有活动弹窗
    this.wordLookup.disconnect();

    if (this.currentVideoUrlValue) {
      URL.revokeObjectURL(this.currentVideoUrlValue);
    }
    if (this.player) {
      this.player.destroy();
    }
  }


  // 加载字幕
  loadInitialSubtitles() {
    // 检查是否有初始字幕数据（从HTML data属性传递）
    const initialSubtitles = this.subtitlesValue;
    const videoPath = this.element.dataset.videoSubtitleMergedVideoPathValue;
    // 如果有视频路径，设置视频源
    if (videoPath && this.hasVideoTarget) {
      this.loadVideoFromPath(videoPath);
    }
    // 如果有字幕数据，渲染字幕列表
    if (initialSubtitles && initialSubtitles.length > 0) {
      this.currentIndexValue = -1;
      this.renderSubtitleList();
      this.updateSubtitleCount();
    }
  }
  loadVideoFromPath(videoPath) {
    // 设置视频源
    if (this.hasVideoTarget) {
      this.videoTarget.src = videoPath;
      this.videoTarget.load(); // 确保重新加载视频
    }
  }
}
