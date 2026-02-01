import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = {
    videoId: Number
  }

  connect() {
    this.setupWordClickListeners()
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
