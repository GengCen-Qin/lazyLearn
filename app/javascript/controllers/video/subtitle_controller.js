import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["subtitle", "wordPopup"];
  static values = {
    index: { type: Number, default: -1 },
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
      const subtitleItem = e.target.closest("[data-video--subtitle-target='subtitle']");
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
    this.seekToSubtitleByIndex(Math.min(this.subtitleTargets.length - 1, this.indexValue + 1));
  }

  // 根据索引跳转到字幕
  seekToSubtitleByIndex(index) {
    const subtitle = this.subtitleTargets.find(el => parseInt(el.dataset.index) === index);
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
  }

  // 当索引值改变时自动调用（Stimulus 回调）
  indexValueChanged() {
    this.updateActiveSubtitle();
    this.scrollToCurrentSubtitle();
  }

  // 更新当前字幕样式
  updateActiveSubtitle() {
    // 移除所有字幕项的激活状态
    this.subtitleTargets.forEach((item) => {
      item.classList.remove("active");
    });

    // 为当前字幕添加激活状态
    if (this.indexValue >= 0) {
      const currentElement = this.subtitleTargets.find(el => parseInt(el.dataset.index) === this.indexValue);
      if (currentElement) {
        currentElement.classList.add("active");
      }
    }
  }

  // 滚动到字幕位置
  scrollToCurrentSubtitle() {
    const activeElement = this.subtitleTargets.find(el => el.classList.contains('active'));
    if (activeElement) {
      activeElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }

  // 同步字幕到当前播放时间
  syncSubtitles(time) {
    if (this.subtitleTargets.length === 0) return;

    // 查找当前时间对应的字幕索引
    let newIndex = -1;
    for (let i = 0; i < this.subtitleTargets.length; i++) {
      const start = parseFloat(this.subtitleTargets[i].dataset.start);
      const nextStart = i + 1 < this.subtitleTargets.length
        ? parseFloat(this.subtitleTargets[i + 1].dataset.start)
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
