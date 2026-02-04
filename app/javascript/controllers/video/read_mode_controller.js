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
        window.lookupWord(word)
      }
    })
  }
}
