import { Controller } from "@hotwired/stimulus";

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
      this.wordDialog.close();
    });

    // ESC键清空历史记录并关闭
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.wordDialog.open) {
        e.preventDefault();
        this.clearWordHistory();
        this.wordDialog.close();
      }
    });

    // 点击dialog外部清空历史记录并关闭
    this.wordDialog.addEventListener("click", (e) => {
      if (e.target === this.wordDialog) {
        this.clearWordHistory();
        this.wordDialog.close();
      }
    });

    // 设置单词点击事件委托（处理Turbo Stream更新后的内容）
    this.setupWordClickListeners();
  }

  // 添加单词到历史记录
  addToWordHistory(word) {
    const history = JSON.parse(this.wordDialog.dataset.wordHistory || "[]");

    history.push(word);

    this.wordDialog.dataset.wordHistory = JSON.stringify(history);
    this.wordDialog.dataset.currentIndex = (history.length - 1).toString();

    this.updateBackButtonVisibility();
  }

  // 回退到上一个单词
  async goBackToPreviousWord() {
    const history = JSON.parse(this.wordDialog.dataset.wordHistory || "[]");
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
    // 检查是否已经有历史记录
    const history = JSON.parse(this.wordDialog.dataset.wordHistory || "[]");

    if (history.length === 0) {
      this.clearWordHistory();
    }

    if (addToHistory) {
      this.addToWordHistory(word);
    }

    // 立即显示弹窗和加载状态
    if (!this.wordDialog.open) {
      this.wordDialog.showModal();
    }
    this.showLoadingMessage();

    try {
      // 从 data 属性获取 video ID
      const videoId = this.element.dataset.videoId;

      const response = await fetch(`/word_lookup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": this.getCSRFToken(),
          "Accept": "text/vnd.turbo-stream.html"
        },
        body: JSON.stringify({ word: word }),
      });

      const turboStream = await response.text();

      Turbo.renderStreamMessage(turboStream);
    } catch (error) {
      this.showErrorMessage('查询失败，请稍后重试');
    }
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
    document.addEventListener("click", (e) => {
      const button = e.target.closest(".pronunciation-btn");
      if (button) {
        e.stopPropagation();
        const audioUrl = button.dataset.audioUrl;
        if (audioUrl) {
          this.playAudio(audioUrl);
        }
      }
    });
  }

  // 添加单词点击监听器（使用事件委托处理Turbo Stream更新后的内容）
  setupWordClickListeners() {
    document.addEventListener("click", (e) => {
      const wordElement = e.target.closest(".word-lookup-popup");
      if (wordElement) {
        e.preventDefault();
        e.stopPropagation();
        const word = wordElement.dataset.word;
        if (word) {
          this.lookupWord(word);
        }
      }
    });
  }

  // 播放音频
  playAudio(audioUrl) {
    try {
      const audio = new Audio(audioUrl);
      audio.play().catch(error => {
        console.warn('Failed to play pronunciation audio:', error);
      });
    } catch (error) {
      console.warn('Failed to create audio element:', error);
    }
  }

  // 获取CSRF令牌
  getCSRFToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute("content") : "";
  }

  disconnect() {
    if (this.wordDialog && this.wordDialog.open) {
      this.clearWordHistory();
      this.wordDialog.close();
    }
  }
}
