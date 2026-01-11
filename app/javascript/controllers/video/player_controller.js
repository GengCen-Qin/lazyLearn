import { Controller } from "@hotwired/stimulus"
import Plyr from "plyr"

export default class extends Controller {
  connect() {
    this.player = null;
    this.initialized();
    this.setupKeyboardShortcuts();
    this.setupSeekToListener();
  }

  setupSeekToListener() {
    this.seekToHandler = (e) => { this.seekTo(e.detail.start) };
    window.addEventListener('video:seekTo', this.seekToHandler);
  }

  disconnect() {
    this.disposePlayer();
    this.removeEventListeners();
  }

  disposePlayer() {
    if (this.player && typeof this.player.isDisposed === 'function' && !this.player.isDisposed()) {
      this.player.dispose();
    }
    this.player = null;
  }

  removeEventListeners() {
    this.removeKeyboardListener();
    this.removeSeekToListener();
  }

  removeKeyboardListener() {
    if (this.keyboardShortcutHandler) {
      document.removeEventListener("keydown", this.keyboardShortcutHandler);
      this.keyboardShortcutHandler = null;
    }
  }

  removeSeekToListener() {
    if (this.seekToHandler) {
      window.removeEventListener('video:seekTo', this.seekToHandler);
      this.seekToHandler = null;
    }
  }

  initialized() {
    if (typeof videojs !== "undefined") {
      requestAnimationFrame(() => {
        const videoElement = this.findVideoElement();
        if (!videoElement) {
          this.player = null;
          return;
        }

        const existingPlayer = this.getExistingPlayer();
        if (existingPlayer) {
          this.player = existingPlayer;
          return;
        }

        this.createPlayer(videoElement);
      });
    } else {
      this.player = null;
    }
  }

  findVideoElement() {
    return this.element.querySelector('#videoPlayer');
  }

  getExistingPlayer() {
    return videojs.getPlayers()['videoPlayer'];
  }

  getPlayerOptions() {
    return {
      autoplay: false,
      preload: 'auto',
      controls: true,
      muted: false,
      playsinline: true,
      html5: {
        vhs: {
          overrideNative: true
        },
        nativeVideoTracks: false,
        nativeAudioTracks: false,
        nativeTextTracks: false
      },
      playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2]
    };
  }

  createPlayer(videoElement) {
    try {
      this.player = videojs(videoElement, this.getPlayerOptions(), () => {
        this.setupPlayerEvents();
      });
    } catch (error) {
      this.player = null;
    }
  }

  setupPlayerEvents() {
    this.player.on('timeupdate', () => {
      window.dispatchEvent(new CustomEvent('player:updatePlayInfo', {
        detail: { currentTime: this.player.currentTime() }
      }));
    });

    this.player.on('loadedmetadata', () => {
      window.dispatchEvent(new CustomEvent('player:updatePlayInfo', {
        detail: { currentTime: this.player.currentTime() }
      }));
    });
  }

  setupKeyboardShortcuts() {
    this.keyboardShortcutHandler = (e) => {
      if (e.target.tagName === "INPUT") return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          e.stopPropagation();
          this.togglePlay();
          break;
      }
    };
    document.addEventListener("keydown", this.keyboardShortcutHandler);
  }

  togglePlay() {
    if (this.player && typeof this.player.paused === 'function') {
      if (this.player.paused()) {
        this.player.play();
      } else {
        this.player.pause();
      }
    }
  }

  play() {
    if (this.player && typeof this.player.play === 'function') {
      this.player.play();
    }
  }

  pause() {
    if (this.player && typeof this.player.pause === 'function') {
      this.player.pause();
    }
  }

  seekTo(time) {
    if (!this.player) return;

    if (this.isVideoJsPlayer()) {
      this.player.currentTime(time);
    } else if (this.player.currentTime !== undefined) {
      this.player.currentTime = time;
    } else if (this.player.media) {
      this.player.media.currentTime = time;
    }
  }

  isVideoJsPlayer() {
    return typeof this.player.currentTime === 'function';
  }

  getCurrentTime() {
    if (!this.player) return 0;

    if (this.isVideoJsPlayer()) {
      return this.player.currentTime();
    }
    return this.player.currentTime || this.player.media?.currentTime || 0;
  }

  getDuration() {
    if (!this.player) return 0;

    if (typeof this.player.duration === 'function') {
      return this.player.duration();
    }
    return this.player.duration || this.player.media?.duration || 0;
  }
}
