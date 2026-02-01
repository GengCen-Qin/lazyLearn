import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="video--subtitle"
export default class extends Controller {
  static values = {
    index: Number,
  };

  connect() {
    this.setupKeyboardShortcuts();
    this.setupClickHandler();
    this.setupEventListeners();
  }

  // 设置键盘快捷键
  setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT") return;

      switch (e.code) {
        case "ArrowLeft":
          e.preventDefault();
          e.stopPropagation();
          this.jumpToPrevious();
          break;
        case "ArrowRight":
          e.preventDefault();
          e.stopPropagation();
          this.jumpToNext();
          break;
      }
    });
  }

  // 设置点击事件处理
  setupClickHandler() {
    this.element.addEventListener("click", (e) => {
      const subtitleItem = e.target.closest(".subtitle-item");
      if (subtitleItem && !e.target.closest(".word-lookup-popup")) {
        const index = parseInt(subtitleItem.dataset.index);
        const start = parseFloat(subtitleItem.dataset.start);
        if (!isNaN(index) && !isNaN(start)) {
          this.seekToSubtitle(index, start);
        }
      }
    });
  }

  // 设置播放器事件监听
  setupEventListeners() {
    window.addEventListener('player:updatePlayInfo', (e) => {
      this.syncSubtitles(e.detail.currentTime);
    });
  }

  // 跳转到上一条字幕
  jumpToPrevious() {
    this.seekToSubtitleByIndex(Math.max(0, this.indexValue - 1));
  }

  // 跳转到下一条字幕
  jumpToNext() {
    const subtitles = this.element.querySelectorAll(".subtitle-item");
    const currentIndex = this.indexValue;
    const targetIndex = Math.min(subtitles.length - 1, currentIndex + 1);
    this.seekToSubtitleByIndex(targetIndex);
  }

  // 根据索引跳转到字幕
  seekToSubtitleByIndex(index) {
    const subtitle = this.element.querySelector(`[data-index="${index}"]`);
    if (subtitle) {
      const start = parseFloat(subtitle.dataset.start);
      if (!isNaN(start)) {
        this.seekToSubtitle(index, start);
      }
    }
  }

  // 跳转到指定字幕
  seekToSubtitle(index, start) {
    this.setCurrentSubtitle(index);
    window.dispatchEvent(new CustomEvent('video:seekTo', { detail: { start: start } }));
  }

  // 设置当前字幕
  setCurrentSubtitle(index) {
    this.indexValue = index;
    this.updateActiveSubtitle();
    this.scrollToCurrentSubtitle();
  }

  // 更新当前字幕样式
  updateActiveSubtitle() {
    // 移除所有字幕项的激活状态
    document.querySelectorAll(".subtitle-item").forEach((item) => {
      item.classList.remove("active");
    });

    // 为当前字幕添加激活状态
    if (this.indexValue >= 0) {
      const currentElement = document.querySelector(
        `[data-index="${this.indexValue}"]`,
      );
      if (currentElement) {
        currentElement.classList.add("active");
      }
    }
  }

  // 滚动到字幕位置
  scrollToCurrentSubtitle() {
    const activeElement = document.querySelector(".subtitle-item.active");
    if (activeElement) {
      activeElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }

  // 同步字幕到当前播放时间
  syncSubtitles(time) {
    const subtitles = this.element.querySelectorAll(".subtitle-item");
    if (subtitles.length === 0) return;

    // 查找当前时间对应的字幕索引
    let newIndex = -1;
    for (let i = 0; i < subtitles.length; i++) {
      const start = parseFloat(subtitles[i].dataset.start);
      const nextStart = i + 1 < subtitles.length
        ? parseFloat(subtitles[i + 1].dataset.start)
        : Number.MAX_SAFE_INTEGER;

      if (time >= start && time < nextStart) {
        newIndex = i;
        break;
      }
    }

    if (newIndex !== -1 && newIndex !== this.indexValue) {
      this.setCurrentSubtitle(newIndex);
    }
  }
}
