import { Controller } from "@hotwired/stimulus"

// 章节阅读器控制器
export default class extends Controller {
  static targets = ["tocSidebar", "tocOverlay"]

  static values = {
    readingMode: { type: Boolean, default: false }
  }

  connect() {
    // 从 URL 参数或 localStorage 恢复阅读模式状态
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('reading_mode') === 'true' || localStorage.getItem('readingMode') === 'true') {
      this.readingModeValue = true
      document.body.classList.add('reading-mode')
    }
  }

  // 切换阅读模式
  toggleReadingMode() {
    this.readingModeValue = !this.readingModeValue
    if (this.readingModeValue) {
      document.body.classList.add('reading-mode')
      localStorage.setItem('readingMode', 'true')
    } else {
      document.body.classList.remove('reading-mode')
      localStorage.setItem('readingMode', 'false')
    }
  }

  // 切换目录显示
  toggleToc() {
    this.tocSidebarTarget.classList.remove("translate-x-full")
    this.tocOverlayTarget.classList.remove("hidden")
  }

  // 关闭目录
  closeToc() {
    this.tocSidebarTarget.classList.add("translate-x-full")
    this.tocOverlayTarget.classList.add("hidden")
  }
}
