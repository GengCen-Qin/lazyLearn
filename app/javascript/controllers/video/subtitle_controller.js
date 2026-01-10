import { Controller } from "@hotwired/stimulus"
import { Utils } from "controllers/utils";

// Connects to data-controller="video--subtitle"
export default class extends Controller {
  static values = {
    subtitles: Array,
    index: Number,
  };

  connect() {
    this.utils = new Utils();
    this.isAutoScrolling = false;
    this.render()
    this.setupKeyboardShortcuts();
    window.addEventListener('player:updatePlayInfo', e => {
      this.updateSubtitleByTime(e.detail.currentTime);
      this.syncSubtitles(e.detail.currentTime);
    });
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

  // 跳转到上一条字幕
  jumpToPrevious() {
    if (!(this.hasSubtitlesValue && this.subtitlesValue.length > 0)) return;

    const targetIndex = Math.max(0, this.indexValue - 1);
    this.seekToSubtitle(targetIndex);
    this.setCurrentSubtitle(targetIndex);
  }

  // 跳转到下一条字幕
  jumpToNext() {
    if (!(this.hasSubtitlesValue && this.subtitlesValue.length > 0)) return;

    const targetIndex = Math.min(this.subtitlesValue.length - 1, this.indexValue + 1);
    this.seekToSubtitle(targetIndex);
    this.setCurrentSubtitle(targetIndex);
  }

  // 渲染字幕
  render() {
    if (!(this.hasSubtitlesValue && this.subtitlesValue.length > 0)) return

    this.element.innerHTML = ''

    // 为每条字幕创建UI元素
    this.subtitlesValue.forEach((subtitle, index) => {
      const item = document.createElement("div");
      item.className = "subtitle-item p-2 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors duration-150";
      item.dataset.index = index;
      item.dataset.start = subtitle.start;
      item.innerHTML = `
        <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">${this.utils.formatTime(subtitle.start)}</div>
        <div class="text-sm text-gray-800 dark:text-gray-200">${this.utils.processSubtitleText(subtitle.text)}</div>
      `;

      // 设置字幕行点击事件（用于时间跳转）
      item.addEventListener("click", (e) => {
        // 如果点击的是单词，不触发时间跳转（避免冲突）
        if (e.target.classList.contains("word-lookup-popup")) {
          e.stopPropagation();
        } else {
          this.seekToSubtitle(index);
          this.setCurrentSubtitle(index)
        }
      });

      this.element.appendChild(item);
    });
  }

  // 视频播放到对应的位置
  seekToSubtitle(index) {
    const subtitle = this.subtitlesValue[index];
    window.dispatchEvent(new CustomEvent('video:seekTo', { detail: { start: subtitle.start } }));
  }

  // 更新当前字幕样式
  setCurrentSubtitle(index) {
    this.indexValue = index;

    this.updateActiveSubtitle(); // 更新当前字幕高亮
    this.scrollToCurrentSubtitle(); // 滚动到当前字幕
    this.updateStatusBar(); // 更新状态栏
  }

  // 样式更新
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
    if (activeElement && !this.isAutoScrolling) {
      const now = Date.now();
      if (now - this.lastScrollTime < 100) return; // 防止频繁滚动

      this.isAutoScrolling = true;
      this.lastScrollTime = now;

      activeElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      setTimeout(() => {
        this.isAutoScrolling = false;
      }, 300);
    }
  }

  // 更新字幕底部状态栏
  updateStatusBar() {
    const subtitle = this.subtitlesValue[this.indexValue];
    window.dispatchEvent(new CustomEvent('video:updatePlayInfo', { detail: { start: subtitle.start, index: this.indexValue, total: this.subtitlesValue.length } }));
  }

  // 根据视频当前播放时间，更新字幕底部状态栏
  updateSubtitleByTime(time) {
    const index = this.subtitlesValue.findIndex((subtitle) => time >= subtitle.start && time < subtitle.end);

    window.dispatchEvent(new CustomEvent('video:updatePlayInfo', { detail: { start: time, index: index, total: this.subtitlesValue.length } }));
  }

  // 同步字幕到当前播放时间
  syncSubtitles(time) {
    // 需要注意第二段的结束时间 和 第一段的开始时间是一样的，计算的时候注意
    const newSubtitleIndex = this.subtitlesValue.findIndex((subtitle) => time >= subtitle.start && time < subtitle.end)

    if (newSubtitleIndex !== this.indexValue) {
      this.setCurrentSubtitle(newSubtitleIndex);
    }
  }
}
