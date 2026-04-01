import { Controller } from "@hotwired/stimulus"

// 音频练习控制器 - 纯前端交互
export default class extends Controller {
  static values = {
    audioId: Number,
    segments: Array
  }

  static targets = ["input", "answer"]

  // 切换答案显示/隐藏
  toggleAnswer(event) {
    const index = event.params.index
    
    // 查找对应的答案元素
    const answer = this.answerTargets.find(el => el.dataset.index == index)
    
    if (!answer) {
      console.error("未找到答案元素，index:", index, "targets:", this.answerTargets)
      return
    }
    
    // 查找对应的按钮并更新文本
    const button = this.element.querySelector(`button[data-audio-practice-param*='"index": ${index}']`)
    const isHidden = answer.classList.contains("hidden")
    
    if (isHidden) {
      answer.classList.remove("hidden")
      if (button) button.textContent = "隐藏原句"
    } else {
      answer.classList.add("hidden")
      if (button) button.textContent = "查看原句"
    }
  }
}
