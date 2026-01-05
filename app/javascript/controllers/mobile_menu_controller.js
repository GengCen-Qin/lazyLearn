import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="mobile-menu"
export default class extends Controller {
  static targets = ["menu", "hamburgerIcon", "closeIcon", "overlay"]

  connect() {
    // 初始化时确保菜单是关闭状态
    this.overlayTarget.classList.add("hidden")
  }

  toggle() {
    const isHidden = this.overlayTarget.classList.contains("hidden")

    if (isHidden) {
      this.open()
    } else {
      this.close()
    }
  }

  open() {
    // 显示遮罩层
    this.overlayTarget.classList.remove("hidden")

    // 切换图标
    this.hamburgerIconTarget.classList.add("hidden")
    this.closeIconTarget.classList.remove("hidden")

    // 添加动画效果
    requestAnimationFrame(() => {
      this.menuTarget.classList.remove("scale-95", "opacity-0")
      this.menuTarget.classList.add("scale-100", "opacity-100")
    })

    // 防止页面滚动
    document.body.style.overflow = "hidden"
  }

  close() {
    // 添加关闭动画
    this.menuTarget.classList.remove("scale-100", "opacity-100")
    this.menuTarget.classList.add("scale-95", "opacity-0")

    // 等待动画完成后隐藏遮罩层
    setTimeout(() => {
      this.overlayTarget.classList.add("hidden")
      // 恢复图标状态
      this.hamburgerIconTarget.classList.remove("hidden")
      this.closeIconTarget.classList.add("hidden")
      // 恢复页面滚动
      document.body.style.overflow = ""
    }, 300)
  }

  // ESC键关闭菜单
  disconnect() {
    document.body.style.overflow = ""
  }
}
