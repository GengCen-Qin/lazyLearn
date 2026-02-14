import { Controller } from "@hotwired/stimulus"

// 字体大小控制器 - 独立处理章节阅读器的字体缩放
export default class extends Controller {
  static values = {
    minSize: { type: Number, default: 12 },
    maxSize: { type: Number, default: 28 },
    step: { type: Number, default: 2 },
    currentSize: { type: Number, default: 18 },
    storageKey: { type: String, default: "chapterFontSize" }
  }

  connect() {
    // 从 localStorage 恢复保存的字号
    const savedSize = localStorage.getItem(this.storageKeyValue)
    if (savedSize) {
      this.currentSizeValue = parseInt(savedSize, 10)
    } else {
      this.currentSizeValue = this.currentSizeValue
    }
    this.applyFontSize()
  }

  // 增大字体
  increase() {
    if (this.currentSizeValue < this.maxSizeValue) {
      this.currentSizeValue += this.stepValue
      this.applyFontSize()
    }
  }

  // 减小字体
  decrease() {
    if (this.currentSizeValue > this.minSizeValue) {
      this.currentSizeValue -= this.stepValue
      this.applyFontSize()
    }
  }

  // 应用字体大小到内容区域
  applyFontSize() {
    // 查找内容区域的 prose 元素
    const contentElement = document.querySelector(".prose")
    if (contentElement) {
      contentElement.style.setProperty("--font-size", `${this.currentSizeValue}px`)
    }
    // 保存到 localStorage
    localStorage.setItem(this.storageKeyValue, this.currentSizeValue.toString())
  }

  // 监听字号变化
  currentSizeValueChanged() {
    this.applyFontSize()
  }
}
