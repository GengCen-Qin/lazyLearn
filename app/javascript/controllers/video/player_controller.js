import { Controller } from "@hotwired/stimulus"
import Plyr from "plyr"

// Connects to data-controller="video--player"
export default class extends Controller {
  connect() {
    this.player = null;
    this.initialize()
    this.setupEventListeners()
    window.addEventListener('video:seekTo', e => { this.seekTo(e.detail.start) })
  }

  disconnect() {
    if (this.player) {
      this.player.destroy();
    }
  }

  initialize() {
    if (typeof Plyr !== "undefined") {
      // 使用Plyr播放器，提供更好的控制界面
      this.player = new Plyr(this.element, {
        controls: ["play", "progress", "duration", "settings", "fullscreen"], // 播放控制按钮
        settings: ["speed"],
        clickToPlay: true,
        tooltips: {
          controls: true, // 显示控制按钮提示
          seek: true, // 显示进度条拖拽提示
        },
        i18n: {
          // 国际化 - 中文界面
          play: "播放",
          pause: "暂停",
          seek: "拖动",
          mute: "静音",
          unmute: "取消静音",
          speed: "变速",
          settings: "设置",
          enterFullscreen: "全屏",
          exitFullscreen: "退出全屏",
        },
        fullscreen: {
          enabled: true,
          fallback: true,
          iosNative: true, // iOS设备使用原生全屏
        },
      });
      // 添加全屏事件监听器
      this.setupFullscreenListeners();
    } else {
      this.player = this.element;
    }
  }

  // 设置视频播放器事件监听器
  setupEventListeners() {
    if (this.player) {
      const videoElement = this.element;

      videoElement.addEventListener("timeupdate", () => {
        this.updateStatusBar();
      });

      videoElement.addEventListener("loadedmetadata", () => {
        this.updateStatusBar();
      });
    }
  }

  updateStatusBar(currentTime = this.getCurrentTime()) {
    window.dispatchEvent(new CustomEvent('player:updatePlayInfo', { detail: { currentTime: currentTime }}));
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
      const videoElement = this.element;

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

  // 处理视频播放错误
  handleVideoError(event, handler) {
    handler.showError("视频文件播放失败，请检查文件格式是否支持");
  }

  // 切换视频播放/暂停状态
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

  // 跳转到指定时间
  seekTo(time) {
    if (this.player) {
      if (this.player.currentTime !== undefined) {
        this.player.currentTime = time;
      } else if (this.player.media) {
        this.player.media.currentTime = time;
      }
    }
  }

  // 获取当前播放时间
  getCurrentTime() {
    if (this.player) {
      return this.player.currentTime || this.player.media?.currentTime || 0;
    }
    return 0;
  }

  // 获取视频总时长
  getDuration() {
    if (this.player) {
      return this.player.duration || this.player.media?.duration || 0;
    }
    return 0;
  }
}
