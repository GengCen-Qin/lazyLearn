import Plyr from "plyr";

/**
 * 视频控制功能
 * 负责视频播放器的初始化、事件监听和播放控制
 */
export class VideoControls {
  constructor(videoTarget) {
    this.videoTarget = videoTarget;
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

  // 更新当前时间（从主控制器调用）
  handleTimeUpdate() {
    // 此方法应从主控制器调用
  }


  // 获取视频总时长
  getDuration() {
    if (this.player) {
      return this.player.duration || this.player.media?.duration || 0;
    }
    return 0;
  }
}
