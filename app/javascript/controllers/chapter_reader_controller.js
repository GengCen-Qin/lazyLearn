import { Controller } from "@hotwired/stimulus"

// 章节阅读器控制器
export default class extends Controller {
  static targets = ["tocSidebar", "tocOverlay"]

  connect() {
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
