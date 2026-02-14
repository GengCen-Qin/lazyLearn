import { Controller } from "@hotwired/stimulus";
import { post } from "@rails/request.js";

/**
 * 视频管理控制器
 * 处理单词查询功能
 */
export default class extends Controller {
  static targets = [
    "message",
    "backBtn",
    "closeBtn",
    "detail",
  ];

  connect() {
    // 单词查询历史记录系统
    this.wordDialog = this.element;
    this.wordBackBtn = this.backBtnTarget;
    this.wordCloseBtn = this.closeBtnTarget;

    // 初始化历史记录
    this.initWordHistory();

    // 设置事件监听
    this.setupWordHistoryEvents();
    this.setupPronunciationListeners();
    this.setupGlobalWordLookupEvents();

    // 当前播放的 Audio 对象
    this.currentAudio = null;
  }

  // 停止当前播放的音频
  stopCurrentAudio() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }

  // 初始化单词查询历史记录
  initWordHistory() {
    this.wordDialog.dataset.wordHistory = JSON.stringify([]);
    this.wordDialog.dataset.currentIndex = "0";
  }

  // 设置单词历史记录事件监听
  setupWordHistoryEvents() {
    this.wordBackBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.goBackToPreviousWord();
    });

    // 关闭按钮事件 - 清空历史记录
    this.wordCloseBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.clearWordHistory();
      this.stopCurrentAudio();
      this.wordDialog.close();
    });

    // ESC键清空历史记录并关闭
    document.addEventListener("keydown", this._handleEscapeKey = (e) => {
      if (e.key === "Escape" && this.wordDialog.open) {
        e.preventDefault();
        this.clearWordHistory();
        this.stopCurrentAudio();
        this.wordDialog.close();
      }
    });

    // 点击dialog外部清空历史记录并关闭
    this.wordDialog.addEventListener("click", this._handleDialogClick = (e) => {
      if (e.target === this.wordDialog) {
        this.clearWordHistory();
        this.stopCurrentAudio();
        this.wordDialog.close();
      }
    });

    // 设置单词点击事件委托（处理Turbo Stream更新后的内容）
    this.setupWordClickListeners();
  }

  // 添加单词到历史记录
  addToWordHistory(word) {
    const history = this.getHistory()

    history.push(word);

    this.wordDialog.dataset.wordHistory = JSON.stringify(history);
    this.wordDialog.dataset.currentIndex = (history.length - 1).toString();

    this.updateBackButtonVisibility();
  }

  // 回退到上一个单词
  async goBackToPreviousWord() {
    const history = this.getHistory()
    const currentIndex = parseInt(this.wordDialog.dataset.currentIndex || "0");

    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      const previousWord = history[newIndex];

      this.wordDialog.dataset.currentIndex = newIndex.toString();
      this.wordDialog.dataset.wordHistory = JSON.stringify(history.slice(0, newIndex + 1));
      this.updateBackButtonVisibility();

      // 重新查询上一个单词（不添加到历史）
      await this.lookupWord(previousWord, false);
    }
  }

  /**
   * 异步查询单词释义
   * 发送请求到后端API，创建多层弹窗显示释义
   */
  async lookupWord(word, addToHistory = true) {
    if (this.getHistory().length === 0) {
      this.clearWordHistory();
    }

    if (addToHistory) {
      this.addToWordHistory(word);
    }

    this.wordDialog.showModal();

    this.showLoadingMessage();

    try {
      await post('/word_lookup', {
        body: { word },
        responseKind: 'turbo-stream'
      });
    } catch (error) {
      this.showErrorMessage('查询失败，请稍后重试');
    }
  }

  // 获取历史单词记录
  getHistory() {
    return JSON.parse(this.wordDialog.dataset.wordHistory || "[]")
  }

  // 更新回退按钮可见性
  updateBackButtonVisibility() {
    const currentIndex = parseInt(this.wordDialog.dataset.currentIndex || "0");

    if (currentIndex > 0) {
      this.wordBackBtn.classList.remove("hidden");
    } else {
      this.wordBackBtn.classList.add("hidden");
    }
  }

  // 清空历史记录
  clearWordHistory() {
    this.wordDialog.dataset.wordHistory = JSON.stringify([]);
    this.wordDialog.dataset.currentIndex = "0";
    this.updateBackButtonVisibility();
  }

  // 显示加载状态
  showLoadingMessage() {
    if (this.hasDetailTarget) {
      this.detailTarget.innerHTML = `
        <div class="text-center text-gray-500 dark:text-gray-400 py-8">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <p class="mt-2 text-sm">查询中...</p>
        </div>
      `;
    }
  }

  // 显示错误信息
  showErrorMessage(message) {
    if (this.hasDetailTarget) {
      this.detailTarget.innerHTML = `
        <div class="text-center text-gray-500 dark:text-gray-400 py-8">
          <svg class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p class="text-sm">${message}</p>
        </div>
      `;
    }
  }

  // 添加发音监听器（使用事件委托，不需要每次更新后重新绑定）
  setupPronunciationListeners() {
    // 保存事件处理函数引用，以便在 disconnect 时移除
    this._handlePronunciationClick = (e) => {
      const button = e.target.closest(".pronunciation-btn");
      if (button) {
        e.stopPropagation();
        const audioUrl = button.dataset.audioUrl;
        if (audioUrl) {
          this.playAudio(audioUrl);
        }
      }
    };
    document.addEventListener("click", this._handlePronunciationClick);
  }

  // 添加单词点击监听器（使用事件委托处理Turbo Stream更新后的内容）
  setupWordClickListeners() {
    // 保存事件处理函数引用，以便在 disconnect 时移除
    this._handleWordClick = (e) => {
      const wordElement = e.target.closest(".word-lookup-popup");
      if (wordElement) {
        e.preventDefault();
        e.stopPropagation();
        const word = wordElement.dataset.word;
        if (word) {
          // 触发暂停事件，暂停当前播放的视频/音频
          window.dispatchEvent(new CustomEvent('media:pause'));
          this.stopCurrentAudio();
          this.lookupWord(word);
        }
      }
    };
    document.addEventListener("click", this._handleWordClick);
  }

  // 播放音频（停止之前的音频）
  playAudio(audioUrl) {
    try {
      // 先停止当前正在播放的音频
      this.stopCurrentAudio();

      const audio = new Audio(audioUrl);
      this.currentAudio = audio;

      audio.play().catch(error => {
        console.warn('Failed to play pronunciation audio:', error);
        this.currentAudio = null;
      });
    } catch (error) {
      console.warn('Failed to create audio element:', error);
    }
  }

  // 设置全局单词查询事件监听
  setupGlobalWordLookupEvents() {
    // 保存事件处理函数引用，以便在 disconnect 时移除
    this._handleWordLookupQuery = (event) => {
      const { word, addToHistory = true } = event.detail;
      if (word && typeof word === 'string') {
        // 触发暂停事件
        window.dispatchEvent(new CustomEvent('media:pause'));
        // 停止当前音频
        this.stopCurrentAudio();
        // 调用现有的查询方法
        this.lookupWord(word, addToHistory);
      }
    };
    document.addEventListener('word-lookup:query', this._handleWordLookupQuery);
  }

  disconnect() {
    // 移除事件监听器，防止重复添加
    if (this._handleEscapeKey) {
      document.removeEventListener("keydown", this._handleEscapeKey);
    }
    if (this._handleDialogClick) {
      this.wordDialog?.removeEventListener("click", this._handleDialogClick);
    }
    if (this._handlePronunciationClick) {
      document.removeEventListener("click", this._handlePronunciationClick);
    }
    if (this._handleWordClick) {
      document.removeEventListener("click", this._handleWordClick);
    }
    if (this._handleWordLookupQuery) {
      document.removeEventListener('word-lookup:query', this._handleWordLookupQuery);
    }

    // 停止当前播放的音频
    this.stopCurrentAudio();

    if (this.wordDialog && this.wordDialog.open) {
      this.clearWordHistory();
      this.wordDialog.close();
    }
  }
}
