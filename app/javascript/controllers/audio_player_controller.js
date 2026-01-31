import { Controller } from "@hotwired/stimulus"
import { Utils } from "controllers/utils";

// 音频播放器控制器，负责音频播放和字幕同步
export default class extends Controller {
  static targets = ['player', 'subtitleList', 'currentTime', 'currentSubtitleIndex']
  static values = {
    subtitles: Array,      // 字幕数据数组
    index: Number,         // 当前字幕索引
  }

  // 初始化控制器
  connect() {
    this.utils = new Utils();
    this.isAutoScrolling = false;
    this.setupAudioEventListeners();
    this.setupSubtitleClickHandler();
    this.setupMediaPauseListener();
  }

  // 设置音频播放事件监听器
  setupAudioEventListeners() {
    if (this.hasPlayerTarget) {
      this.playerTarget.addEventListener('timeupdate', () => {
        this.updateSubtitleDisplayByTime(this.playerTarget.currentTime);
        this.syncSubtitleToPlaybackTime(this.playerTarget.currentTime);
      });

      this.playerTarget.addEventListener('loadedmetadata', () => {
        this.updateSubtitleDisplayByTime(this.playerTarget.currentTime);
      });
    }
  }

  // 设置字幕点击事件监听器
  setupSubtitleClickHandler() {
    if (this.hasSubtitleListTarget) {
      this.subtitleListTarget.addEventListener('click', (event) => {
        const subtitleItem = event.target.closest('.subtitle-item');
        if (subtitleItem && !event.target.closest('.word-lookup-popup')) {
          const index = parseInt(subtitleItem.dataset.index);
          const subtitle = this.subtitlesValue[index];
          if (subtitle) {
            this.seekTo(subtitle.start);
            this.setActiveSubtitle(index);
          }
        }
      });
    }
  }

  // 设置媒体暂停事件监听器
  setupMediaPauseListener() {
    this.mediaPauseHandler = () => {
      if (this.playerTarget && !this.playerTarget.paused) {
        this.playerTarget.pause();
      }
    };
    window.addEventListener('media:pause', this.mediaPauseHandler);
  }

  // 清理资源
  disconnect() {
    if (this.mediaPauseHandler) {
      window.removeEventListener('media:pause', this.mediaPauseHandler);
      this.mediaPauseHandler = null;
    }
  }

  // 跳转到指定时间
  seekTo(time) {
    if (this.playerTarget && !isNaN(time)) {
      this.playerTarget.currentTime = time;
    }
  }

  // 根据播放时间更新字幕显示
  updateSubtitleDisplayByTime(time) {
    const index = this.subtitlesValue.findIndex((subtitle) => time >= subtitle.start && time < subtitle.end);
    if (index === -1) return;

    if (this.hasCurrentTimeTarget) {
      this.currentTimeTarget.textContent = this.utils.formatTime(time);
    }

    if (this.hasCurrentSubtitleIndexTarget) {
      this.currentSubtitleIndexTarget.textContent = `${index + 1}/${this.subtitlesValue.length}`;
    }
  }

  // 同步字幕到当前播放时间
  syncSubtitleToPlaybackTime(time) {
    const newSubtitleIndex = this.subtitlesValue.findIndex((subtitle) => time >= subtitle.start && time < subtitle.end)
    if (newSubtitleIndex === -1) return;

    if (newSubtitleIndex !== this.indexValue) {
      this.setActiveSubtitle(newSubtitleIndex);
    }
  }

  // 设置当前活跃字幕
  setActiveSubtitle(index) {
    this.indexValue = index;

    this.updateActiveSubtitleHighlight(); // 更新当前字幕高亮
    this.scrollToActiveSubtitle(); // 滚动到当前字幕
    this.updateStatusDisplay(); // 更新状态栏
  }

  // 更新当前字幕高亮
  updateActiveSubtitleHighlight() {
    if (this.hasSubtitleListTarget) {
      // 移除所有字幕项的激活状态
      this.subtitleListTarget.querySelectorAll(".subtitle-item").forEach((item) => {
        item.classList.remove("active");
      });

      // 为当前字幕添加激活状态
      if (this.indexValue >= 0) {
        const currentElement = this.subtitleListTarget.querySelector(
          `[data-index="${this.indexValue}"]`,
        );
        if (currentElement) {
          currentElement.classList.add("active");
        }
      }
    }
  }

  // 滚动到当前字幕位置
  scrollToActiveSubtitle() {
    if (this.hasSubtitleListTarget && !this.isAutoScrolling) {
      const activeElement = this.subtitleListTarget.querySelector(".subtitle-item.active");
      if (activeElement) {
        const now = Date.now();
        if (now - this.lastScrollTime < 100) return; // 防止频繁滚动

        this.isAutoScrolling = true;
        this.lastScrollTime = now;

        // 使用容器滚动而不是scrollIntoView，避免触发页面滚动
        const container = this.subtitleListTarget;
        
        // 计算元素相对于容器的位置
        const elementRect = activeElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const elementTopRelative = elementRect.top - containerRect.top + container.scrollTop;
        const elementHeight = activeElement.offsetHeight;
        const containerHeight = container.clientHeight;
        
        // 计算滚动位置，使元素在容器中间
        const scrollTop = elementTopRelative - (containerHeight / 2) + (elementHeight / 2);
        
        container.scrollTo({
          top: scrollTop,
          behavior: "smooth"
        });

        setTimeout(() => {
          this.isAutoScrolling = false;
        }, 300);
      }
    }
  }

  // 更新状态栏显示
  updateStatusDisplay() {
    const subtitle = this.subtitlesValue[this.indexValue];

    if (this.hasCurrentTimeTarget) {
      this.currentTimeTarget.textContent = this.utils.formatTime(subtitle.start);
    }

    if (this.hasCurrentSubtitleIndexTarget) {
      this.currentSubtitleIndexTarget.textContent = `${this.indexValue + 1}/${this.subtitlesValue.length}`;
    }
  }
}
