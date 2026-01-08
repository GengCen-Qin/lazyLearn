/**
 * 视频控制功能
 * 负责视频播放器的初始化、事件监听和播放控制
 */
export class VideoControls {
  constructor(videoTarget) {
    this.videoTarget = videoTarget;
    this.player = null;
  }

  // 初始化视频播放器
  initializePlayer() {
    if (typeof Player !== "undefined") {
      // 使用xgplayer播放器，提供更好的控制界面
      this.player = new Player({
        el: this.videoTarget.parentElement,
        url: this.videoTarget.src || '',
        lang: 'zh-cn',
        download: false,
      });

      // 添加全屏事件监听器
      this.setupFullscreenListeners();
    } else {
      this.player = this.videoTarget;
    }
  }

  // 设置视频播放器事件监听器
  setupEventListeners(handler) {
    if (this.player) {
      const videoElement = this.player.video || this.player.media || this.player;

      videoElement.addEventListener("timeupdate", () => {
        handler.handleTimeUpdate();
      });

      videoElement.addEventListener("loadedmetadata", () => {
        handler.updateStatusBar();
      });

      videoElement.addEventListener("error", (e) => {
        handler.handleVideoError(e);
      });
    }
  }

  // 设置全屏事件监听器
  setupFullscreenListeners() {
    if (!this.player) return;

    const handleFullscreenChange = () => {
      const isFullscreen = document.fullscreenElement ||
                          document.webkitFullscreenElement ||
                          document.mozFullScreenElement ||
                          document.msFullscreenElement;

      // 全屏状态改变时调整视频样式
      const videoContainer = document.querySelector('#video-player-container');
      const videoElement = this.player.media || this.videoTarget;

      if (isFullscreen) {
        // 进入全屏模式
        videoElement.style.width = '100vw';
        videoElement.style.height = '100vh';
        videoElement.style.maxHeight = '100vh';
        videoElement.style.objectFit = 'contain';

        // 确保容器也是全屏尺寸
        if (videoContainer) {
          videoContainer.style.width = '100vw';
          videoContainer.style.height = '100vh';
          videoContainer.style.maxHeight = '100vh';
        }
      } else {
        // 退出全屏模式，恢复原始样式
        videoElement.style.width = '';
        videoElement.style.height = '';
        videoElement.style.maxHeight = '';
        videoElement.style.objectFit = 'contain';

        if (videoContainer) {
          videoContainer.style.width = '';
          videoContainer.style.height = '';
          videoContainer.style.maxHeight = '';
        }
      }
    };

    // 监听全屏变化事件
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
  }

  // 异步加载视频文件
  async loadVideo(event, currentVideoUrlValue, handler) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      // 清理之前的视频URL以释放内存
      if (currentVideoUrlValue) {
        URL.revokeObjectURL(currentVideoUrlValue);
      }

      // 创建新的视频对象URL
      const newVideoUrl = URL.createObjectURL(file);

      // 设置视频源（兼容xgplayer和原生video）
      if (this.player.src) {
        // xgplayer播放器
        this.player.src = newVideoUrl;
      } else {
        // 原生视频元素
        this.videoTarget.src = newVideoUrl;
      }

      // 获取视频时长并显示成功消息
      const duration = this.player.duration || 0;
      handler.showSuccess(
        `视频加载成功: ${file.name} (${this.formatDuration(duration)})`,
      );

      return newVideoUrl;
    } catch (error) {
      handler.showError(`视频文件加载失败: ${error.message}`);
      return null;
    }
  }

  // 根据文件扩展名检测视频MIME类型
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
      m4v: "video/mp4", // M4V格式
      "3gp": "video/3gpp", // 3GP格式
      flv: "video/x-flv", // Flash视频格式
    };
    return mimeTypes[extension] || "video/mp4"; // 默认返回MP4
  }

  // 处理视频播放错误
  handleVideoError(event, handler) {
    handler.showError("视频文件播放失败，请检查文件格式是否支持");
  }

  // 切换视频播放/暂停状态
  togglePlay() {
    if (this.player) {
      if (typeof this.player.togglePlay === "function") {
        this.player.togglePlay();
      } else if (typeof this.player.play === "function") {
        // 原生视频元素的手动控制
        if (this.player.paused) {
          this.player.play();
        } else {
          this.player.pause();
        }
      }
    } else {
      console.error("视频控制器未初始化");
    }
  }

  // 播放
  play() {
    this.player.play();
  }

  // 暂停
  pause() {
    this.player.pause();
  }

  // 更新当前时间（从主控制器调用）
  handleTimeUpdate() {
    // 此方法应从主控制器调用
  }

  // 跳转到指定时间
  seekTo(time) {
    if (this.player) {
      if (this.player.currentTime !== undefined) {
        this.player.currentTime = time;
      } else if (this.player.media) {
        this.player.media.currentTime = time;
      } else if (this.player.video) {
        this.player.video.currentTime = time;
      }
    }
  }

  // 获取当前播放时间
  getCurrentTime() {
    if (this.player) {
      return this.player.currentTime || this.player.media?.currentTime || this.player.video?.currentTime || 0;
    }
    return 0;
  }

  // 获取视频总时长
  getDuration() {
    if (this.player) {
      return this.player.duration || this.player.media?.duration || this.player.video?.duration || 0;
    }
    return 0;
  }

  // 格式化持续时间
  formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
}
