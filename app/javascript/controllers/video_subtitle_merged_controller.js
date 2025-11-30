import { Controller } from "@hotwired/stimulus";
import Plyr from "plyr";

// 视频字幕播放器控制器
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
    this.initializePlayer();
    this.setupEventListeners();
    this.setupKeyboardShortcuts();
    this.setupWordLookup();

    this.isAutoScrolling = false;
    this.lastScrollTime = 0;
    this.currentPopupWord = null;

    this.loadInitialSubtitles();
  }

  /**
   * 初始化视频播放器
   * 使用Plyr库提供更好的用户体验，否则使用原生视频元素
   */
  initializePlayer() {
    if (typeof Plyr !== "undefined") {
      // 使用Plyr播放器，提供更好的控制界面和体验
      this.player = new Plyr(this.videoTarget, {
        controls: ["play", "progress", "duration", "fullscreen"], // 播放控制按钮
        tooltips: {
          controls: true, // 显示控制按钮提示
          seek: true, // 显示拖动进度条提示
        },
        captions: {
          active: false, // 默认不启用字幕
          update: false, // 不自动更新字幕
        },
        i18n: {
          // 国际化文本 - 中文界面
          play: "播放",
          pause: "暂停",
          seek: "拖动",
          mute: "静音",
          unmute: "取消静音",
          enterFullscreen: "全屏",
          exitFullscreen: "退出全屏",
        },
      });
    } else {
      // 回退到原生视频元素
      this.player = this.videoTarget;
    }
  }
  /** 设置视频播放器事件监听器 */
  setupEventListeners() {
    if (this.player) {
      const videoElement = this.player.media || this.player;

      videoElement.addEventListener("timeupdate", () => {
        this.handleTimeUpdate();
      });

      videoElement.addEventListener("loadedmetadata", () => {
        this.updateStatusBar();
      });

      videoElement.addEventListener("error", (e) => {
        this.handleVideoError(e);
      });
    }
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
   * 异步加载用户选择的视频文件
   * 支持多种视频格式，自动检测文件类型
   * 创建临时URL并设置视频源
   */
  async loadVideo(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      // 清理之前的视频URL以释放内存
      if (this.currentVideoUrlValue) {
        URL.revokeObjectURL(this.currentVideoUrlValue);
      }

      // 创建新的视频对象URL
      this.currentVideoUrlValue = URL.createObjectURL(file);

      // 检测文件类型
      let detectedType = file.type || this.detectVideoType(file.name);

      // 准备视频源配置
      const sources = [
        {
          src: this.currentVideoUrlValue,
          type: detectedType,
        },
      ];

      // 为MOV文件添加MP4回退支持（常见兼容性问题）
      if (file.name.toLowerCase().endsWith(".mov")) {
        sources.push({
          src: this.currentVideoUrlValue,
          type: "video/mp4",
        });
      }

      // 设置视频源（兼容Plyr和原生video）
      if (this.player.source) {
        // Plyr播放器
        this.player.source = {
          type: "video",
          sources: sources,
        };
      } else {
        // 原生视频元素
        this.videoTarget.src = this.currentVideoUrlValue;
      }

      // 获取视频时长并显示成功消息
      const duration = this.player.duration || 0;
      this.showSuccess(
        `视频加载成功: ${file.name} (${this.formatDuration(duration)})`,
      );
    } catch (error) {
      this.showError(`视频文件加载失败: ${error.message}`);
    }
  }
  /**
   * 根据文件扩展名检测视频MIME类型
   * 支持常见视频格式，默认返回mp4格式
   */
  detectVideoType(filename) {
    const extension = filename.toLowerCase().split(".").pop();
    const mimeTypes = {
      mp4: "video/mp4", // MP4格式
      webm: "video/webm", // WebM格式
      ogg: "video/ogg", // OGG视频格式
      ogv: "video/ogg", // OGG视频格式
      avi: "video/x-msvideo", // AVI格式
      mov: "video/quicktime", // QuickTime MOV格式
      mkv: "video/x-matroska", // MKV格式
      m4v: "video/mp4", // M4V格式（iPhone录屏）
      "3gp": "video/3gpp", // 3GP格式（移动设备）
      flv: "video/x-flv", // Flash视频格式
    };
    return mimeTypes[extension] || "video/mp4"; // 默认返回MP4
  }

  /**
   * 处理视频播放错误
   * 显示用户友好的错误信息
   */
  handleVideoError(event) {
    this.showError("视频文件播放失败，请检查文件格式是否支持");
  }
  /**
   * 切换视频播放/暂停状态
   * 兼容Plyr播放器和原生video元素
   */
  togglePlay() {
    if (this.player) {
      if (typeof this.player.togglePlay === "function") {
        // 使用Plyr的切换方法
        this.player.togglePlay();
      } else {
        // 原生视频元素的手动控制
        if (this.player.paused) {
          this.player.play();
        } else {
          this.player.pause();
        }
      }
    }
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
    if (this.player) {
      if (this.player.currentTime !== undefined) {
        this.player.currentTime = time;
      } else if (this.player.media) {
        this.player.media.currentTime = time;
      }
    }
  }
  getCurrentTime() {
    if (this.player) {
      return this.player.currentTime || this.player.media?.currentTime || 0;
    }
    return 0;
  }
  getDuration() {
    if (this.player) {
      return this.player.duration || this.player.media?.duration || 0;
    }
    return 0;
  }
  // ========================================
  // 字幕相关方法
  // ========================================

  /**
   * 异步加载JSON字幕文件
   * 支持两种格式：直接数组和包含segments的对象
   * 验证字幕数据完整性并按时间排序
   */
  async loadSubtitles(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      // 读取文件内容并解析JSON
      const text = await file.text();
      const data = JSON.parse(text);

      // 验证并解析字幕数据
      let subtitles = [];
      if (Array.isArray(data)) {
        // 格式1：直接的字幕数组
        subtitles = data;
      } else if (data.segments && Array.isArray(data.segments)) {
        // 格式2：包含segments字段的对象
        subtitles = data.segments;
      } else {
        throw new Error("字幕文件格式不正确");
      }

      // 验证每条字幕的结构完整性
      for (let i = 0; i < subtitles.length; i++) {
        if (typeof subtitles[i].start !== "number" || !subtitles[i].text) {
          throw new Error(`字幕数据格式错误，第 ${i + 1} 条字幕缺少必要字段`);
        }
      }

      // 按开始时间排序字幕
      this.subtitlesValue = subtitles.sort((a, b) => a.start - b.start);
      this.currentIndexValue = -1; // 重置当前索引

      // 更新UI显示
      this.renderSubtitleList();
      this.updateSubtitleCount();
      this.showSuccess(
        `字幕加载成功: ${file.name} (${subtitles.length} 条字幕)`,
      );
    } catch (error) {
      this.showError(`字幕文件格式错误: ${error.message}`);
    }
  }
  /**
   * 渲染字幕列表到UI
   * 为每条字幕创建可点击的行，支持时间跳转和单词查询
   * 将字幕文本中的英文单词设为可点击
   */
  renderSubtitleList() {
    if (!this.hasSubtitleListTarget) return;
    const container = this.subtitleListTarget;

    // 无字幕时显示提示信息
    if (this.subtitlesValue.length === 0) {
      container.innerHTML =
        '<div class="no-subtitles text-center text-gray-500 p-6 text-sm">请上传字幕文件</div>';
      return;
    }

    // 清空容器
    container.innerHTML = "";

    // 为每条字幕创建UI元素
    this.subtitlesValue.forEach((subtitle, index) => {
      const item = document.createElement("div");
      item.className =
        "subtitle-item p-2 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors duration-150";
      item.dataset.index = index;
      item.dataset.start = subtitle.start;

      const time = this.formatTime(subtitle.start);

      // 将字幕文本按空格分割为单词，使每个英文单词可点击
      const processedText = this.processSubtitleText(subtitle.text);

      item.innerHTML = `
        <div class="text-xs text-gray-500 mb-1">${time}</div>
        <div class="text-sm text-gray-800">${processedText}</div>
      `;

      // 设置字幕行点击事件（用于时间跳转）
      item.addEventListener("click", (e) => {
        // 如果点击的是单词，不触发时间跳转（避免冲突）
        if (e.target.classList.contains("word-lookup")) {
          e.stopPropagation();
          return;
        }
        this.seekToSubtitle(index);
      });

      container.appendChild(item);
    });

    // 添加单词点击事件监听
    this.addWordClickListeners();
  }
  /**
   * 同步字幕到当前播放时间
   * 根据当前时间找到应该显示的字幕并更新UI
   */
  syncSubtitles(currentTime) {
    const newSubtitleIndex = this.findCurrentSubtitleIndex(currentTime);

    // 如果字幕索引发生变化，更新相关UI
    if (newSubtitleIndex !== this.currentIndexValue) {
      this.currentIndexValue = newSubtitleIndex;
      this.updateActiveSubtitle(); // 更新当前字幕高亮
      this.scrollToCurrentSubtitle(); // 滚动到当前字幕
      this.updateStatusBar(); // 更新状态栏
    }
  }

  /**
   * 手动设置当前字幕索引
   * 用于点击字幕列表时的跳转
   */
  setCurrentSubtitle(index) {
    this.currentIndexValue = index;
    this.updateActiveSubtitle(); // 更新当前字幕高亮
    this.scrollToCurrentSubtitle(); // 滚动到当前字幕
    this.updateStatusBar(); // 更新状态栏
  }

  /**
   * 根据当前播放时间查找应该显示的字幕索引
   * 从后往前遍历，找到第一个开始时间小于等于当前时间的字幕
   */
  findCurrentSubtitleIndex(currentTime) {
    for (let i = this.subtitlesValue.length - 1; i >= 0; i--) {
      if (currentTime >= this.subtitlesValue[i].start) {
        return i;
      }
    }
    return -1; // 没有匹配的字幕
  }

  /**
   * 更新当前字幕的激活状态
   * 移除所有字幕的active类，为当前字幕添加active类
   */
  updateActiveSubtitle() {
    // 移除所有字幕项的激活状态
    document.querySelectorAll(".subtitle-item").forEach((item) => {
      item.classList.remove("active");
    });

    // 为当前字幕添加激活状态
    if (this.currentIndexValue >= 0) {
      const currentElement = document.querySelector(
        `[data-index="${this.currentIndexValue}"]`,
      );
      if (currentElement) {
        currentElement.classList.add("active");
      }
    }
  }
  /**
   * 滚动到当前激活的字幕位置
   * 使用平滑滚动并防止频繁滚动
   */
  scrollToCurrentSubtitle() {
    const activeElement = document.querySelector(".subtitle-item.active");
    if (activeElement && !this.isAutoScrolling) {
      const now = Date.now();
      if (now - this.lastScrollTime < 100) return; // 防止频繁滚动

      this.isAutoScrolling = true;
      this.lastScrollTime = now;

      // 平滑滚动到当前字幕，使其居中显示
      activeElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      // 500ms后重置滚动状态
      setTimeout(() => {
        this.isAutoScrolling = false;
      }, 500);
    }
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

    let targetIndex;
    if (this.currentIndexValue <= 0) {
      targetIndex = 0; // 不超出第一条
    } else {
      targetIndex = this.currentIndexValue - 1;
    }
    this.seekToSubtitle(targetIndex);
  }

  /**
   * 跳转到下一条字幕
   * 如果已经是最后一条，则停在最后一条
   */
  jumpToNext() {
    if (this.subtitlesValue.length === 0) return;

    let targetIndex;
    if (
      this.currentIndexValue < 0 ||
      this.currentIndexValue >= this.subtitlesValue.length - 1
    ) {
      targetIndex = this.subtitlesValue.length - 1; // 不超出最后一条
    } else {
      targetIndex = this.currentIndexValue + 1;
    }
    this.seekToSubtitle(targetIndex);
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
    // Update current time display
    if (this.hasCurrentTimeTarget) {
      this.currentTimeTarget.textContent = this.formatTime(
        this.getCurrentTime(),
      );
    }
    // Update current subtitle index
    if (this.hasCurrentSubtitleIndexTarget) {
      const current = this.currentIndexValue;
      const total = this.subtitlesValue.length;
      if (current >= 0 && total > 0) {
        this.currentSubtitleIndexTarget.textContent = `${
          current + 1
        } / ${total}`;
      } else {
        this.currentSubtitleIndexTarget.textContent = `- / ${total}`;
      }
    }
  }
  // ========================================
  // Message Methods
  // ========================================
  showSuccess(message) {
    this.showMessage(message, "success");
  }
  showError(message) {
    this.showMessage(message, "error");
  }
  showMessage(message, type = "success") {
    // Remove existing messages
    const existingMessages = this.element.querySelectorAll(".success, .error");
    existingMessages.forEach((msg) => msg.remove());
    // Create new message element
    const messageDiv = document.createElement("div");
    messageDiv.className = type;
    messageDiv.textContent = message;
    // Style the message
    messageDiv.style.cssText = `
      padding: 10px 15px;
      margin: 10px 0;
      border-radius: 5px;
      font-size: 14px;
      font-weight: 500;
      ${
        type === "success"
          ? "background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb;"
          : "background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;"
      }
    `;
    // Add to the top of the container
    const fileSection = this.element.querySelector(".file-section");
    if (fileSection) {
      fileSection.insertBefore(messageDiv, fileSection.firstChild);
    } else {
      this.element.insertBefore(messageDiv, this.element.firstChild);
    }
    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.remove();
      }
    }, 3000);
  }
  // ========================================
  // Utility Methods
  // ========================================
  formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
  // ========================================
  // 单词查询相关方法
  // ========================================

  /**
   * 设置单词查询功能
   * 初始化多层弹窗管理系统，支持嵌套查词
   */
  setupWordLookup() {
    // 多层弹窗管理系统初始化
    this.popupContainer = document.getElementById("wordPopupContainer"); // 弹窗容器
    this.popupTemplate = document.getElementById("wordPopupTemplate"); // 弹窗HTML模板
    this.activePopups = []; // 当前活动的弹窗列表
    this.popupHistory = []; // 弹窗历史记录
    this.maxPopups = 10; // 最大弹窗层数，防止无限嵌套
    this.baseZIndex = 50; // 基础z-index值
    this.offsetStep = 20; // 每层弹窗的视觉偏移量

    // 设置全局事件监听
    this.setupGlobalPopupEvents();
  }

  setupGlobalPopupEvents() {
    // ESC键关闭最上层弹窗
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.activePopups.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        this.closeTopPopup();
      }
    });

    // 点击弹窗外部区域关闭最上层弹窗
    if (this.popupContainer) {
      this.popupContainer.addEventListener("click", (e) => {
        if (e.target === this.popupContainer && this.activePopups.length > 0) {
          this.closeTopPopup();
        }
      });
    }
  }

  showPopupContainer() {
    if (this.popupContainer) {
      this.popupContainer.classList.remove("hidden");
    }
  }

  hidePopupContainer() {
    if (this.popupContainer) {
      this.popupContainer.classList.add("hidden");
    }
  }
  /**
   * 处理字幕文本，将英文单词标记为可点击
   * 使用改进的词法分析来正确处理标点符号和其他字符
   */
  processSubtitleText(text) {
    // 使用改进的词法分析来正确处理标点符号
    return this.tokenizeText(text)
      .map((token) => {
        // 只对长度>=2的英文单词添加点击功能
        if (token.type === "word" && token.value.length >= 2) {
          return `<span class="word-lookup inline-block px-0.5 rounded hover:bg-blue-100 hover:text-blue-700 cursor-pointer transition-colors duration-150" data-word="${token.value}">${this.escapeHtml(token.value)}</span>`;
        }
        // 其他情况（标点、中文字符、数字等）直接显示
        return this.escapeHtml(token.value);
      })
      .join("");
  }

  /**
   * 文本分词器
   * 将文本分解为英文单词、中文字符、数字、标点符号等token
   * 支持中英文混合文本的准确分词
   */
  tokenizeText(text) {
    const tokens = [];
    // 正则表达式匹配：英文单词 | 中文字符 | 数字 | 标点符号 | 空白字符
    const regex =
      /([a-zA-Z]+)|([\u4e00-\u9fff]+)|(\d+)|([^\w\s\u4e00-\u9fff])|(\s+)/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const [
        fullMatch,
        englishWord, // 英文单词
        chineseChars, // 中文字符
        numbers, // 数字
        punctuation, // 标点符号
        whitespace, // 空白字符
      ] = match;

      if (englishWord) {
        tokens.push({ type: "word", value: englishWord });
      } else if (chineseChars) {
        tokens.push({ type: "chinese", value: chineseChars });
      } else if (numbers) {
        tokens.push({ type: "number", value: numbers });
      } else if (punctuation) {
        tokens.push({ type: "punctuation", value: punctuation });
      } else if (whitespace) {
        tokens.push({ type: "whitespace", value: whitespace });
      }
    }

    return tokens;
  }
  /**
   * 添加单词点击事件监听器
   * 为所有可点击的英文单词添加查词功能
   */
  addWordClickListeners() {
    // 移除旧的事件监听器，避免重复绑定
    document.querySelectorAll(".word-lookup").forEach((element) => {
      element.replaceWith(element.cloneNode(true));
    });

    // 重新获取所有单词元素并添加事件监听器
    const wordElements = document.querySelectorAll(".word-lookup");
    wordElements.forEach((element, index) => {
      const word = element.dataset.word;
      element.addEventListener("click", (e) => {
        e.stopPropagation(); // 阻止事件冒泡
        this.lookupWord(word, e.target);
      });
    });
  }

  /**
   * 异步查询单词释义
   * 发送请求到后端API，创建多层弹窗显示释义
   */
  async lookupWord(word, clickedElement, sourceLayer = 0) {
    // 验证输入和弹窗数量限制
    if (!word || this.activePopups.length >= this.maxPopups) {
      return;
    }

    // 检查是否已经在顶层显示这个单词（避免重复查询）
    if (this.activePopups.length > 0) {
      const topPopup = this.activePopups[this.activePopups.length - 1];
      if (topPopup.word === word) {
        return; // 已经在顶层显示
      }
    }

    // 先显示弹窗容器
    this.showPopupContainer();

    // 创建新的弹窗层（初始隐藏，等待数据加载完成）
    const popupId = this.createPopupLayer(word, sourceLayer, false);

    try {
      // 发送查询请求到后端API
      const response = await fetch("/word_lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": this.getCSRFToken(),
        },
        body: JSON.stringify({ word: word }),
      });
      const data = await response.json();

      if (data.success && data.word) {
        // 查询成功，显示单词释义
        this.showPopupDefinition(popupId, data.word, word);
        this.revealPopup(popupId);
      } else {
        // 未找到单词
        this.showPopupError(popupId, `未找到单词 "${word}" 的释义`);
        this.revealPopup(popupId);
      }
    } catch (error) {
      // 网络错误或其他异常
      this.showPopupError(popupId, `查询失败，请稍后重试`);
      this.revealPopup(popupId);
    }
  }
  getCSRFToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute("content") : "";
  }
  // ========================================
  // 多层弹窗管理相关方法
  // ========================================

  /**
   * 创建新的弹窗层
   * 支持多层嵌套弹窗，每层都有视觉偏移和层级管理
   */
  createPopupLayer(word, sourceLayer = 0, showImmediately = true) {
    if (!this.popupTemplate || !this.popupContainer) return null;

    // 克隆HTML模板
    const template = this.popupTemplate.content.cloneNode(true);
    const popupLayer = template.querySelector(".word-popup-layer");

    // 设置唯一ID和层级属性
    const popupId = `word-popup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    popupLayer.id = popupId;
    popupLayer.dataset.word = word;
    popupLayer.dataset.layer = this.activePopups.length;

    // 计算视觉偏移位置（每层偏移，创建嵌套效果）
    const offset = this.activePopups.length * this.offsetStep;
    popupLayer.style.left = `${offset}px`;
    popupLayer.style.top = `${offset}px`;
    popupLayer.style.zIndex = this.baseZIndex + this.activePopups.length;

    // 确保容器可见
    if (this.popupContainer.classList.contains("hidden")) {
      this.popupContainer.classList.remove("hidden");
    }

    // 添加到容器
    this.popupContainer.appendChild(popupLayer);

    // 设置事件监听
    this.setupPopupEvents(popupId, word);

    // 添加到活动弹窗列表
    const popupData = {
      id: popupId,
      word: word,
      element: popupLayer,
      sourceLayer: sourceLayer,
    };
    this.activePopups.push(popupData);

    // 初始隐藏，等待显示指令（用于加载状态的显示）
    if (!showImmediately) {
      popupLayer.style.opacity = "0";
      popupLayer.style.pointerEvents = "none";
      popupLayer.style.transition = "opacity 0.2s ease";
    }

    return popupId;
  }

  /**
   * 设置弹窗的事件监听器
   * 处理关闭按钮和点击事件冒泡
   */
  setupPopupEvents(popupId, word) {
    const popupLayer = document.getElementById(popupId);
    if (!popupLayer) return;

    // 关闭按钮事件
    const closeBtn = popupLayer.querySelector(".word-popup-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        this.closePopup(popupId);
      });
    }

    // 阻止事件冒泡，避免点击弹窗内容时关闭弹窗
    popupLayer.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }

  /**
   * 关闭指定的弹窗
   * 移除DOM元素并从活动列表中删除
   */
  closePopup(popupId) {
    const popupIndex = this.activePopups.findIndex((p) => p.id === popupId);
    if (popupIndex === -1) return;

    const popupData = this.activePopups[popupIndex];

    // 移除DOM元素
    if (popupData.element && popupData.element.parentNode) {
      popupData.element.parentNode.removeChild(popupData.element);
    }

    // 从活动列表中移除
    this.activePopups.splice(popupIndex, 1);

    // 如果没有活动弹窗，隐藏容器
    if (this.activePopups.length === 0) {
      this.hidePopupContainer();
    }
  }

  /**
   * 关闭最顶层的弹窗
   * 用于ESC键和点击外部区域时的处理
   */
  closeTopPopup() {
    if (this.activePopups.length > 0) {
      const topPopup = this.activePopups[this.activePopups.length - 1];
      this.closePopup(topPopup.id);
    }
  }

  /**
   * 显示弹窗加载状态
   * 在等待API响应时显示加载动画
   */
  showPopupLoading(popupId) {
    const contentElement = document.querySelector(
      `#${popupId} .word-popup-content`,
    );
    if (contentElement) {
      contentElement.innerHTML = `
        <div class="text-center text-gray-500 py-8">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p class="mt-2 text-sm">查询中...</p>
        </div>
      `;
    }
  }

  /**
   * 显示弹窗错误状态
   * 当查询失败或未找到单词时显示错误信息
   */
  showPopupError(popupId, message) {
    const contentElement = document.querySelector(
      `#${popupId} .word-popup-content`,
    );
    if (contentElement) {
      contentElement.innerHTML = `
        <div class="text-center text-gray-500 py-8">
          <svg class="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p class="text-sm">${message}</p>
        </div>
      `;
    }
  }

  /**
   * 显示弹窗（从隐藏状态到可见状态）
   * 使用淡入动画效果
   */
  revealPopup(popupId) {
    const popupLayer = document.getElementById(popupId);
    if (!popupLayer) return;

    // 短暂延迟确保DOM已更新
    requestAnimationFrame(() => {
      popupLayer.style.opacity = "1";
      popupLayer.style.pointerEvents = "auto";
    });
  }

  showPopupDefinition(popupId, wordData, sourceWord) {
    const contentElement = document.querySelector(
      `#${popupId} .word-popup-content`,
    );
    if (!contentElement) return;

    // 处理英文释义中的单词，使其可点击
    const processedDefinition = wordData.definition
      ? this.processDefinitionText(wordData.definition)
      : "";

    const processedTranslation = wordData.translation
      ? this.processDefinitionText(wordData.translation, true) // 中文释义不处理英文单词
      : "";

    const processedDetail = wordData.detail
      ? this.processDefinitionText(wordData.detail, true) // 详细信息不处理英文单词
      : "";

    const html = `
      <div class="space-y-4">
        <!-- 单词标题 -->
        <div class="text-center border-b border-gray-200 pb-3">
          <h2 class="text-2xl font-bold text-gray-900 mb-2">${wordData.word}</h2>
          ${wordData.phonetic ? `<p class="text-gray-600">[${wordData.phonetic}]</p>` : ""}
        </div>
        <!-- 词性 -->
        ${
          wordData.pos
            ? `
          <div class="flex justify-center">
            <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              ${wordData.pos}
            </span>
          </div>
        `
            : ""
        }
        <!-- 核心词汇标记 -->
        ${
          wordData.core
            ? `
          <div class="flex justify-center">
            <span class="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
              ⭐ 核心词汇
            </span>
          </div>
        `
            : ""
        }
        <!-- 英文释义 -->
        ${
          wordData.definition
            ? `
          <div>
            <h3 class="font-semibold text-gray-900 mb-2 flex items-center">
              <svg class="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clip-rule="evenodd"/>
              </svg>
              英文释义
            </h3>
            <div class="text-gray-700 text-sm leading-relaxed bg-gray-50 p-3 rounded">
              ${processedDefinition}
            </div>
          </div>
        `
            : ""
        }
        <!-- 中文释义 -->
        ${
          wordData.translation
            ? `
          <div>
            <h3 class="font-semibold text-gray-900 mb-2 flex items-center">
              <svg class="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
              </svg>
              中文释义
            </h3>
            <div class="text-gray-700 text-sm leading-relaxed bg-green-50 p-3 rounded">
              ${processedTranslation}
            </div>
          </div>
        `
            : ""
        }
        <!-- 详细信息 -->
        ${
          wordData.detail
            ? `
          <div>
            <h3 class="font-semibold text-gray-900 mb-2 flex items-center">
              <svg class="w-4 h-4 mr-2 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>
              </svg>
              详细说明
            </h3>
            <div class="text-gray-700 text-sm leading-relaxed bg-purple-50 p-3 rounded">
              ${processedDetail}
            </div>
          </div>
        `
            : ""
        }
        <!-- 标签信息 -->
        ${
          wordData.tag
            ? `
          <div class="flex flex-wrap gap-2 pt-2">
            ${wordData.tag
              .split(",")
              .map(
                (tag) => `
              <span class="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                ${tag.trim()}
              </span>
            `,
              )
              .join("")}
          </div>
        `
            : ""
        }
      </div>
    `;
    contentElement.innerHTML = html;

    // 为新创建的弹窗中的单词添加点击事件
    this.addPopupWordClickListeners(popupId);
  }

  processDefinitionText(text, skipEnglish = false) {
    if (!text) return "";

    // 如果跳过英文单词处理，只做基本的HTML转义
    if (skipEnglish) {
      return this.escapeHtml(text)
        .split(";")
        .map((def) => `<div class="mb-1">• ${def.trim()}</div>`)
        .join("");
    }

    // 处理文本中的单词，使其可点击
    return this.tokenizeText(text)
      .map((token) => {
        if (token.type === "word" && token.value.length >= 2) {
          return `<span class="word-lookup-popup inline-block px-0.5 rounded hover:bg-blue-100 hover:text-blue-700 cursor-pointer transition-colors duration-150" data-word="${token.value}">${this.escapeHtml(token.value)}</span>`;
        }
        // 其他情况（标点、中文字符、数字等）直接显示
        return this.escapeHtml(token.value);
      })
      .join("")
      .split(";")
      .map((def) => `<div class="mb-1">• ${def.trim()}</div>`)
      .join("");
  }

  addPopupWordClickListeners(popupId) {
    const popupElement = document.getElementById(popupId);
    if (!popupElement) return;

    const wordElements = popupElement.querySelectorAll(".word-lookup-popup");
    wordElements.forEach((element) => {
      const word = element.dataset.word;
      element.addEventListener("click", (e) => {
        e.stopPropagation();

        // 查找当前弹窗的层级信息
        const currentPopup = this.activePopups.find((p) => p.id === popupId);
        const sourceLayer = currentPopup
          ? parseInt(currentPopup.element.dataset.layer) || 0
          : 0;

        // 查找新单词，源层级为当前弹窗的层级
        this.lookupWord(word, element, parseInt(sourceLayer));
      });
    });
  }

  disconnect() {
    // 关闭所有活动弹窗
    while (this.activePopups.length > 0) {
      this.closeTopPopup();
    }

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
