import { Controller } from "@hotwired/stimulus";
import Plyr from "plyr";
export default class extends Controller {
  static targets = [
    // Video targets
    "video",
    "videoInput",
    "currentTime",
    "currentSubtitleIndex",
    // Subtitle targets
    "jsonInput",
    "subtitleList",
    "subtitleCount",
    // Message targets
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
  disconnect() {
    if (this.currentVideoUrlValue) {
      URL.revokeObjectURL(this.currentVideoUrlValue);
    }
    if (this.player) {
      this.player.destroy();
    }
  }
  // ========================================
  // Video Player Methods
  // ========================================
  initializePlayer() {
    if (typeof Plyr !== "undefined") {
      this.player = new Plyr(this.videoTarget, {
        controls: [
          "play-large",
          "play",
          "progress",
          "current-time",
          "duration",
          "mute",
          "volume",
          "fullscreen",
        ],
        tooltips: {
          controls: true,
          seek: true,
        },
        captions: {
          active: false,
          update: false,
        },
        i18n: {
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
      this.player = this.videoTarget;
    }
  }
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
  async loadVideo(event) {
    const file = event.target.files[0];
    if (!file) return;
    try {
      // Clean up previous video URL
      if (this.currentVideoUrlValue) {
        URL.revokeObjectURL(this.currentVideoUrlValue);
      }
      this.currentVideoUrlValue = URL.createObjectURL(file);
      // Detect file type
      let detectedType = file.type || this.detectVideoType(file.name);
      // Prepare sources
      const sources = [
        {
          src: this.currentVideoUrlValue,
          type: detectedType,
        },
      ];
      // Add fallback for MOV files
      if (file.name.toLowerCase().endsWith(".mov")) {
        sources.push({
          src: this.currentVideoUrlValue,
          type: "video/mp4",
        });
      }
      // Set video source
      if (this.player.source) {
        this.player.source = {
          type: "video",
          sources: sources,
        };
      } else {
        // Native video element
        this.videoTarget.src = this.currentVideoUrlValue;
      }
      const duration = this.player.duration || 0;
      this.showSuccess(
        `视频加载成功: ${file.name} (${this.formatDuration(duration)})`,
      );
    } catch (error) {
      this.showError(`视频文件加载失败: ${error.message}`);
    }
  }
  detectVideoType(filename) {
    const extension = filename.toLowerCase().split(".").pop();
    const mimeTypes = {
      mp4: "video/mp4",
      webm: "video/webm",
      ogg: "video/ogg",
      ogv: "video/ogg",
      avi: "video/x-msvideo",
      mov: "video/quicktime",
      mkv: "video/x-matroska",
      m4v: "video/mp4",
      "3gp": "video/3gpp",
      flv: "video/x-flv",
    };
    return mimeTypes[extension] || "video/mp4";
  }
  handleVideoError(event) {
    this.showError("视频文件播放失败，请检查文件格式是否支持");
  }
  togglePlay() {
    if (this.player) {
      if (typeof this.player.togglePlay === "function") {
        this.player.togglePlay();
      } else {
        // Native video element
        if (this.player.paused) {
          this.player.play();
        } else {
          this.player.pause();
        }
      }
    }
  }
  handleLeftKey() {
    if (this.subtitlesValue.length > 0) {
      this.jumpToPrevious();
    } else {
      // Seek back 5 seconds if no subtitles
      const currentTime = this.getCurrentTime();
      this.seekTo(Math.max(0, currentTime - 5));
    }
  }
  handleRightKey() {
    if (this.subtitlesValue.length > 0) {
      this.jumpToNext();
    } else {
      // Seek forward 5 seconds if no subtitles
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
  // Subtitle Methods
  // ========================================
  async loadSubtitles(event) {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      // Validate and parse subtitle data
      let subtitles = [];
      if (Array.isArray(data)) {
        subtitles = data;
      } else if (data.segments && Array.isArray(data.segments)) {
        subtitles = data.segments;
      } else {
        throw new Error("字幕文件格式不正确");
      }
      // Validate subtitle structure
      for (let i = 0; i < subtitles.length; i++) {
        if (typeof subtitles[i].start !== "number" || !subtitles[i].text) {
          throw new Error(`字幕数据格式错误，第 ${i + 1} 条字幕缺少必要字段`);
        }
      }
      // Sort subtitles by start time
      this.subtitlesValue = subtitles.sort((a, b) => a.start - b.start);
      this.currentIndexValue = -1;
      this.renderSubtitleList();
      this.updateSubtitleCount();
      this.showSuccess(
        `字幕加载成功: ${file.name} (${subtitles.length} 条字幕)`,
      );
    } catch (error) {
      this.showError(`字幕文件格式错误: ${error.message}`);
    }
  }
  renderSubtitleList() {
    if (!this.hasSubtitleListTarget) return;
    const container = this.subtitleListTarget;
    if (this.subtitlesValue.length === 0) {
      container.innerHTML =
        '<div class="no-subtitles text-center text-gray-500 p-6 text-sm">请上传字幕文件</div>';
      return;
    }
    container.innerHTML = "";
    this.subtitlesValue.forEach((subtitle, index) => {
      const item = document.createElement("div");
      item.className =
        "subtitle-item p-2 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors duration-150";
      item.dataset.index = index;
      item.dataset.start = subtitle.start;
      const time = this.formatTime(subtitle.start);
      // 将字幕文本按空格分割为单词，使每个单词可点击
      const processedText = this.processSubtitleText(subtitle.text);
      item.innerHTML = `
        <div class="text-xs text-gray-500 mb-1">${time}</div>
        <div class="text-sm text-gray-800">${processedText}</div>
      `;
      // 设置字幕行点击事件（用于时间跳转）
      item.addEventListener("click", (e) => {
        // 如果点击的是单词，不触发时间跳转
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
  syncSubtitles(currentTime) {
    const newSubtitleIndex = this.findCurrentSubtitleIndex(currentTime);
    if (newSubtitleIndex !== this.currentIndexValue) {
      this.currentIndexValue = newSubtitleIndex;
      this.updateActiveSubtitle();
      this.scrollToCurrentSubtitle();
      this.updateStatusBar();
    }
  }
  setCurrentSubtitle(index) {
    this.currentIndexValue = index;
    this.updateActiveSubtitle();
    this.scrollToCurrentSubtitle();
    this.updateStatusBar();
  }
  findCurrentSubtitleIndex(currentTime) {
    for (let i = this.subtitlesValue.length - 1; i >= 0; i--) {
      if (currentTime >= this.subtitlesValue[i].start) {
        return i;
      }
    }
    return -1;
  }
  updateActiveSubtitle() {
    // Remove active class from all subtitle items
    document.querySelectorAll(".subtitle-item").forEach((item) => {
      item.classList.remove("active");
    });
    // Add active class to current subtitle
    if (this.currentIndexValue >= 0) {
      const currentElement = document.querySelector(
        `[data-index="${this.currentIndexValue}"]`,
      );
      if (currentElement) {
        currentElement.classList.add("active");
      }
    }
  }
  scrollToCurrentSubtitle() {
    const activeElement = document.querySelector(".subtitle-item.active");
    if (activeElement && !this.isAutoScrolling) {
      const now = Date.now();
      if (now - this.lastScrollTime < 100) return; // Prevent frequent scrolling
      this.isAutoScrolling = true;
      this.lastScrollTime = now;
      activeElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      setTimeout(() => {
        this.isAutoScrolling = false;
      }, 500);
    }
  }
  seekToSubtitle(index) {
    if (index >= 0 && index < this.subtitlesValue.length) {
      const subtitle = this.subtitlesValue[index];
      this.seekTo(subtitle.start);
      this.setCurrentSubtitle(index);
    }
  }
  // Alias method for compatibility with HTML template
  jumpToSubtitle(event) {
    const index = parseInt(event.currentTarget.dataset.index);
    this.seekToSubtitle(index);
  }
  jumpToPrevious() {
    if (this.subtitlesValue.length === 0) return;
    let targetIndex;
    if (this.currentIndexValue <= 0) {
      targetIndex = 0;
    } else {
      targetIndex = this.currentIndexValue - 1;
    }
    this.seekToSubtitle(targetIndex);
  }
  jumpToNext() {
    if (this.subtitlesValue.length === 0) return;
    let targetIndex;
    if (
      this.currentIndexValue < 0 ||
      this.currentIndexValue >= this.subtitlesValue.length - 1
    ) {
      targetIndex = this.subtitlesValue.length - 1;
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
  // Word Lookup Methods
  // ========================================
  setupWordLookup() {
    // 初始化弹窗相关元素
    this.wordPopup = document.getElementById("wordLookupPopup");
    this.wordPopupContent = document.getElementById("wordPopupContent");
    this.closeWordPopupBtn = document.getElementById("closeWordPopup");
    // 设置关闭按钮事件
    if (this.closeWordPopupBtn) {
      this.closeWordPopupBtn.addEventListener("click", () => {
        this.hideWordPopup();
      });
    }
    // 点击弹窗外部区域关闭弹窗
    if (this.wordPopup) {
      this.wordPopup.addEventListener("click", (e) => {
        if (e.target === this.wordPopup) {
          this.hideWordPopup();
        }
      });
    }
    // ESC键关闭弹窗
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !this.wordPopup.classList.contains("hidden")) {
        this.hideWordPopup();
      }
    });
  }
  processSubtitleText(text) {
    // 使用改进的词法分析来正确处理标点符号
    return this.tokenizeText(text)
      .map((token) => {
        if (token.type === 'word' && token.value.length >= 2) {
          return `<span class="word-lookup inline-block px-0.5 rounded hover:bg-blue-100 hover:text-blue-700 cursor-pointer transition-colors duration-150" data-word="${token.value}">${this.escapeHtml(token.value)}</span>`;
        }
        // 其他情况（标点、中文字符、数字等）直接显示
        return this.escapeHtml(token.value);
      })
      .join('');
  }

  tokenizeText(text) {
    const tokens = [];
    const regex = /([a-zA-Z]+)|([\u4e00-\u9fff]+)|(\d+)|([^\w\s\u4e00-\u9fff])|(\s+)/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const [fullMatch, englishWord, chineseChars, numbers, punctuation, whitespace] = match;
      
      if (englishWord) {
        tokens.push({ type: 'word', value: englishWord });
      } else if (chineseChars) {
        tokens.push({ type: 'chinese', value: chineseChars });
      } else if (numbers) {
        tokens.push({ type: 'number', value: numbers });
      } else if (punctuation) {
        tokens.push({ type: 'punctuation', value: punctuation });
      } else if (whitespace) {
        tokens.push({ type: 'whitespace', value: whitespace });
      }
    }
    
    return tokens;
  }
  addWordClickListeners() {
    // 移除旧的事件监听器
    document.querySelectorAll(".word-lookup").forEach((element) => {
      element.replaceWith(element.cloneNode(true));
    });
    // 重新获取所有单词元素并添加事件监听器
    const wordElements = document.querySelectorAll(".word-lookup");
    wordElements.forEach((element, index) => {
      const word = element.dataset.word;
      element.addEventListener("click", (e) => {
        e.stopPropagation();
        this.lookupWord(word, e.target);
      });
    });
  }
  async lookupWord(word, clickedElement) {
    if (!word) {
      return;
    }
    // 如果当前弹窗显示的是同一个单词，直接返回
    if (
      this.currentPopupWord === word &&
      this.wordPopup &&
      !this.wordPopup.classList.contains("hidden")
    ) {
      return;
    }
    // 显示弹窗并显示加载状态
    this.showWordPopup();
    this.showWordLoading();
    try {
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
        this.showWordDefinition(data.word);
        this.currentPopupWord = word;
      } else {
        this.showWordError(`未找到单词 "${word}" 的释义`);
      }
    } catch (error) {
      this.showWordError(`查询失败，请稍后重试`);
    }
  }
  getCSRFToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute("content") : "";
  }
  showWordPopup() {
    if (this.wordPopup) {
      this.wordPopup.classList.remove("hidden");
    }
  }
  hideWordPopup() {
    if (this.wordPopup) {
      this.wordPopup.classList.add("hidden");
      this.currentPopupWord = null;
    }
  }
  showWordLoading() {
    if (this.wordPopupContent) {
      this.wordPopupContent.innerHTML = `
        <div class="text-center text-gray-500 py-8">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p class="mt-2 text-sm">查询中...</p>
        </div>
      `;
    }
  }
  showWordDefinition(wordData) {
    if (!this.wordPopupContent) return;
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
              ${wordData.definition
                .split(";")
                .map((def) => `<div class="mb-1">• ${def.trim()}</div>`)
                .join("")}
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
              ${wordData.translation
                .split(";")
                .map((tran) => `<div class="mb-1">• ${tran.trim()}</div>`)
                .join("")}
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
              ${wordData.detail}
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
    this.wordPopupContent.innerHTML = html;
  }
  showWordError(message) {
    if (this.wordPopupContent) {
      this.wordPopupContent.innerHTML = `
        <div class="text-center text-gray-500 py-8">
          <svg class="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p class="text-sm">${message}</p>
        </div>
      `;
    }
  }
  // ========================================
  // Video Detail Page Methods
  // ========================================
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
