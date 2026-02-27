import { Controller } from "@hotwired/stimulus"

// 章节阅读器控制器
export default class extends Controller {
  static targets = ["tocSidebar", "tocOverlay"]

  static values = {
    readingMode: { type: Boolean, default: false }
  }

  connect() {
    this.initializeReadingMode()
  }

  // 初始化阅读模式
  initializeReadingMode() {
    const mode = localStorage.getItem('readingMode')
    if (mode && JSON.parse(mode)) {
      this.readingModeValue = true
      document.body.classList.add('reading-mode')
    }
  }

  // 切换阅读模式
  toggleReadingMode() {
    this.readingModeValue = !this.readingModeValue
    if (this.readingModeValue) {
      document.body.classList.add('reading-mode')
      localStorage.setItem('readingMode', true)
    } else {
      document.body.classList.remove('reading-mode')
      localStorage.setItem('readingMode', false)
    }
  }

  // 切换目录显示
  toggleToc() {
    this.tocSidebarTarget.classList.toggle("translate-x-full")
    this.tocOverlayTarget.classList.toggle("hidden")
  }
}
