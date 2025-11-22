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
    this.isAutoScrolling = false;
    this.lastScrollTime = 0;
    console.log("Video subtitle merged controller connected");
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
    // Check if Plyr is available
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
      console.log("Plyr player initialized");
    } else {
      console.warn("Plyr library not found, using native video element");
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
        console.log("Video metadata loaded");
        this.updateStatusBar();
      });

      videoElement.addEventListener("error", (e) => {
        this.handleVideoError(e);
      });
    }
  }

  setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      // Ignore if in input field
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

      console.log(
        "Loading video file:",
        file.name,
        "Type:",
        file.type,
        "Size:",
        this.formatFileSize(file.size),
      );

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
        console.log("MOV file detected, adding fallback source");
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
      console.error("Video loading failed:", error);
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
    console.error("Video error:", event);
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
      console.log(
        "Subtitles loaded successfully:",
        file.name,
        subtitles.length,
        "entries",
      );
    } catch (error) {
      console.error("Subtitle loading failed:", error);
      this.showError(`字幕文件格式错误: ${error.message}`);
    }
  }

  renderSubtitleList() {
    if (!this.hasSubtitleListTarget) return;

    const container = this.subtitleListTarget;

    if (this.subtitlesValue.length === 0) {
      container.innerHTML = '<div class="no-subtitles text-center text-gray-500 p-6 text-sm">请上传字幕文件</div>';
      return;
    }

    container.innerHTML = "";

    this.subtitlesValue.forEach((subtitle, index) => {
      const item = document.createElement("div");
      // 使用与视频详情页一致的样式类
      item.className = "subtitle-item p-2 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors duration-150";
      item.dataset.index = index;
      item.dataset.start = subtitle.start;

      const time = this.formatTime(subtitle.start);
      // 使用与视频详情页一致的HTML结构
      item.innerHTML = `
        <div class="text-xs text-gray-500 mb-1">${time}</div>
        <div class="text-sm text-gray-800">${this.escapeHtml(subtitle.text)}</div>
      `;

      item.addEventListener("click", () => {
        this.seekToSubtitle(index);
      });

      container.appendChild(item);
    });

    console.log(
      `Subtitle list rendered, ${this.subtitlesValue.length} entries`,
    );
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

      console.log(
        `Jumped to subtitle ${index + 1}: [${this.formatTime(
          subtitle.start,
        )}] ${subtitle.text}`,
      );
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
    console.log(
      `Previous subtitle: ${targetIndex + 1}/${this.subtitlesValue.length}`,
    );
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
    console.log(
      `Next subtitle: ${targetIndex + 1}/${this.subtitlesValue.length}`,
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
}
