import { Controller } from "@hotwired/stimulus"
import { Utils } from "controllers/utils"

export default class extends Controller {
  static values = {
    subtitles: Array,
    videoId: Number
  }

  static targets = ["subtitleList"]

  utils = new Utils()

  connect() {
    this.render()
    this.setupWordClickListeners()
  }

  // 渲染字幕列表（Read Mode 专用）
  render() {
    const subtitles = this.subtitlesValue || []

    if (!subtitles || subtitles.length === 0) {
      this.element.innerHTML = `
        <div class="text-center text-gray-500 dark:text-gray-400 p-8">
          No subtitles available
        </div>
      `
      return
    }

    this.element.innerHTML = ""

    subtitles.forEach((subtitle, index) => {
      const item = document.createElement("div")
      item.className = "read-mode-subtitle-item dark:bg-gray-800 rounded-lg p-4 mb-3"
      item.dataset.index = index

      // Read Mode 下不显示时间戳，只显示文本
      item.innerHTML = `
        <div class="read-mode-text text-base leading-relaxed text-gray-800 dark:text-gray-200">
          ${this.utils.processSubtitleText(subtitle.text)}
        </div>
      `

      this.element.appendChild(item)
    })
  }

  // 设置单词点击监听（复用 word-lookup 逻辑）
  setupWordClickListeners() {
    this.element.addEventListener("click", (e) => {
      const wordElement = e.target.closest(".word-lookup-popup")
      if (wordElement) {
        const word = wordElement.dataset.word
        this.lookupWord(word)
      }
    })
  }

  // 查询单词（复用 word-lookup_controller 的方法）
  async lookupWord(word) {
    const dialog = document.getElementById("wordInfo")
    if (!dialog) return

    if (!dialog.open) {
      dialog.showModal()
    }

    try {
      const response = await fetch("/word_lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": this.getCSRFToken(),
          "Accept": "text/vnd.turbo-stream.html"
        },
        body: JSON.stringify({ word: word }),
      })

      const turboStream = await response.text()
      Turbo.renderStreamMessage(turboStream)
    } catch (error) {
      console.error("查询单词失败:", error)
    }
  }

  getCSRFToken() {
    const meta = document.querySelector('meta[name="csrf-token"]')
    return meta ? meta.content : ""
  }
}
