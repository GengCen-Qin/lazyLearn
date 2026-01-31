import { Controller } from "@hotwired/stimulus"
import { Utils } from "controllers/utils";

// 音频播放器控制器，负责音频播放和字幕同步
export default class extends Controller {
  static targets = ['player', 'subtitleList', 'currentTime', 'currentSubtitleIndex']
  static values = {
    subtitles: Array,      // 字幕数据数组
    index: Number,         // 当前字幕索引
    repeatMode: { type: Boolean, default: false },     // 复读模式开关
    repeatSubtitleIndex: { type: Number, default: -1 }, // 当前复读的字幕索引
  }

  // 常量定义
  SCROLL_DEBOUNCE_TIME = 100; // 防抖时间（毫秒）
  SCROLL_DELAY_TIME = 300;    // 滚动延迟（毫秒）

  // 初始化控制器
  connect() {
    this.utils = new Utils();
    this.isAutoScrolling = false;
    this.scrollTimeoutId = null; // 用于清理setTimeout
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
        this.handleRepeatMode(this.playerTarget.currentTime);
      });

      this.playerTarget.addEventListener('loadedmetadata', () => {
        this.updateSubtitleDisplayByTime(this.playerTarget.currentTime);
      });
    }
  }

  // 处理复读模式下的循环播放
  handleRepeatMode(currentTime) {
    // 如果没有启用复读模式，直接返回
    if (!this.repeatModeValue || this.repeatSubtitleIndexValue < 0) {
      return;
    }

    // 获取当前复读的字幕
    const currentSubtitle = this.subtitlesValue[this.repeatSubtitleIndexValue];
    if (!currentSubtitle) {
      return;
    }

    // 如果播放时间到达或超过字幕结束时间，循环回开始时间
    if (currentTime >= currentSubtitle.end) {
      this.seekTo(currentSubtitle.start);
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
            // 检查是否需要退出当前的复读模式
            if (this.repeatModeValue && this.repeatSubtitleIndexValue !== index) {
              // 如果当前有复读模式，且点击的不是当前复读模式的行，则退出复读模式
              this.exitRepeatMode();
            }

            this.seekTo(subtitle.start);
            this.setActiveSubtitle(index);
          }
        }
      });
    }
  }

  // 处理复读模式切换按钮点击
  toggleRepeatMode(event) {
    // 不阻止事件冒泡，让事件继续触发字幕行的点击事件
    // 这样可以同时实现：1) 跳转到字幕行 2) 进入复读模式

    const index = parseInt(event.currentTarget.dataset.index);
    if (isNaN(index)) return;

    // 如果当前正在复读这一行，则退出复读模式
    if (this.repeatModeValue && this.repeatSubtitleIndexValue === index) {
      this.exitRepeatMode();
    } else {
      // 否则进入新行的复读模式
      this.enterRepeatMode(index);
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

  // 复读模式值变化回调
  repeatModeValueChanged() {
    this.updateRepeatModeUI();
  }

  // 复读字幕索引值变化回调
  repeatSubtitleIndexValueChanged() {
    this.updateRepeatModeUI();
  }

  // 更新复读模式UI状态
  updateRepeatModeUI() {
    const activeIndex = this.repeatSubtitleIndexValue;
    const isActive = this.repeatModeValue;

    // 更新所有按钮的状态
    const buttons = this.element.querySelectorAll('.repeat-btn');
    buttons.forEach((button, index) => {
      this.updateButtonState(button, index === activeIndex && isActive);
    });

    // 更新字幕项的样式
    const subtitleItems = this.element.querySelectorAll('.subtitle-item');
    subtitleItems.forEach((item, index) => {
      if (index === activeIndex && isActive) {
        item.classList.add('repeat-mode', 'border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20');
      } else {
        item.classList.remove('repeat-mode', 'border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20');
      }
    });
  }

  // 更新按钮状态（提取公共逻辑）
  updateButtonState(button, isActive) {
    const icon = button.querySelector('.repeat-icon');

    if (isActive) {
      // 激活状态：统一使用白色背景+深色图标，兼顾亮色和暗色模式
      button.classList.add('bg-white', 'border-gray-400', 'shadow-lg', 'dark:bg-gray-100');
      button.classList.remove('hover:bg-gray-200', 'dark:hover:bg-gray-600', 'text-gray-600', 'dark:text-gray-300', 'bg-blue-600', 'text-white', 'border-blue-700');
      button.title = '退出复读模式';

      // 使用Tailwind的animate-spin类添加强制旋转动画
      if (icon) {
        icon.classList.add('animate-spin');
        // 激活状态下图标颜色统一为深色，在白色按钮上清晰可见
        icon.classList.remove('text-gray-600', 'dark:text-gray-300', 'text-white');
        icon.classList.add('text-gray-800', 'dark:text-gray-900');
      }
    } else {
      // 非激活状态：恢复默认样式
      button.classList.remove('active', 'bg-white', 'border-gray-400', 'shadow-lg', 'dark:bg-gray-100', 'text-gray-800', 'dark:text-gray-900');
      button.classList.add('hover:bg-gray-200', 'dark:hover:bg-gray-600', 'text-gray-600', 'dark:text-gray-300');
      button.title = '复读模式';

      // 移除旋转动画和特殊颜色
      if (icon) {
        icon.classList.remove('animate-spin', 'text-gray-800', 'dark:text-gray-900');
        icon.classList.add('text-gray-600', 'dark:text-gray-300');
      }
    }
  }

  // 清理资源
  disconnect() {
    if (this.mediaPauseHandler) {
      window.removeEventListener('media:pause', this.mediaPauseHandler);
      this.mediaPauseHandler = null;
    }

    // 清理定时器，避免内存泄漏
    if (this.scrollTimeoutId) {
      clearTimeout(this.scrollTimeoutId);
      this.scrollTimeoutId = null;
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
        if (now - this.lastScrollTime < this.SCROLL_DEBOUNCE_TIME) return; // 防止频繁滚动

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

        // 清理之前的定时器，避免内存泄漏
        if (this.scrollTimeoutId) {
          clearTimeout(this.scrollTimeoutId);
        }

        this.scrollTimeoutId = setTimeout(() => {
          this.isAutoScrolling = false;
        }, this.SCROLL_DELAY_TIME);
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

  // 进入复读模式
  enterRepeatMode(index) {
    if (!this.subtitlesValue || index < 0 || index >= this.subtitlesValue.length) {
      return;
    }

    // 跳转到指定字幕的开始时间
    const subtitle = this.subtitlesValue[index];
    this.seekTo(subtitle.start);

    // 设置复读模式状态（会自动触发valueChanged回调）
    this.repeatSubtitleIndexValue = index;
    this.repeatModeValue = true;
  }

  // 退出复读模式
  exitRepeatMode() {
    // 设置复读模式状态（会自动触发valueChanged回调）
    this.repeatModeValue = false;
    this.repeatSubtitleIndexValue = -1;
  }
}
