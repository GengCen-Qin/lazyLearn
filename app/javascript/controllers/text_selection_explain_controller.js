import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  connect() {
    this.selectedText = ""
    this.floatingIcon = null
    this.selectionTimeout = null
    this.setupTextSelectionListener()
  }

  disconnect() {
    this.removeFloatingIcon()
    document.removeEventListener("mouseup", this.handleSelectionEnd.bind(this))
    document.removeEventListener("touchend", this.handleSelectionEnd.bind(this))
    this.selectedText = ""
  }

  // 设置文本选择监听
  setupTextSelectionListener() {
    this.handleSelectionEnd = this.debounce(this.handleSelectionEnd.bind(this), 300)
    document.addEventListener("mouseup", this.handleSelectionEnd)
    document.addEventListener("touchend", this.handleSelectionEnd)
  }

  // 处理文本选择结束
  handleSelectionEnd() {
    clearTimeout(this.selectionTimeout)
    this.selectionTimeout = setTimeout(() => {
      this.checkTextSelection()
    }, 100)
  }

  // 检查文本选择
  checkTextSelection() {
    const selection = window.getSelection()
    const selectedText = selection.toString().trim()

    if (selectedText.length < 3) {
      this.removeFloatingIcon()
      return
    }

    // 检查选中文本是否在当前控制器元素（read mode内容）内
    const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null
    if (!range) return

    const selectedElement = range.commonAncestorContainer.nodeType === 3
      ? range.commonAncestorContainer.parentElement
      : range.commonAncestorContainer

    // 检查是否在当前控制器元素内
    if (!this.element.contains(selectedElement)) {
      this.removeFloatingIcon()
      return
    }

    this.showFloatingIcon()
  }

  // 显示悬浮图标
  showFloatingIcon() {
    this.removeFloatingIcon()

    // 保存选中的文本，避免点击图标时丢失选择
    const selection = window.getSelection()
    this.selectedText = selection.toString().trim()

    this.floatingIcon = document.createElement("div")

    this.floatingIcon.className = "fixed p-2 rounded-lg bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors duration-200 cursor-pointer shadow-lg z-40"
    this.floatingIcon.style.minWidth = "36px"
    this.floatingIcon.style.minHeight = "36px"

    const darkModeButtonHeight = 36
    const spacing = 10
    const margin = 16
    const bottomPosition = margin + darkModeButtonHeight + spacing

    this.floatingIcon.style.right = `${margin}px`
    this.floatingIcon.style.bottom = `${bottomPosition}px`

    this.floatingIcon.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5 text-white">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
    `

    this.floatingIcon.addEventListener("click", this.handleIconClick.bind(this))

    document.body.appendChild(this.floatingIcon)

    setTimeout(() => {
      this.removeFloatingIcon()
    }, 5000)
  }

  // 移除悬浮图标
  removeFloatingIcon() {
    if (this.floatingIcon) {
      this.floatingIcon.remove()
      this.floatingIcon = null
    }
    this.selectedText = ""
  }

  // 处理图标点击
  async handleIconClick() {
    const selectedText = this.selectedText

    if (!selectedText || selectedText.length < 3) {
      alert("请选择至少3个字符的文本来获得解释")
      return
    }

    this.removeFloatingIcon()
    this.showModal(selectedText)

    try {
      const response = await fetch("/phrase_explain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]').content
        },
        body: JSON.stringify({
          text: selectedText
        })
      })

      const data = await response.json()

      if (data.success) {
        this.updateModal(data.explanation)
      } else {
        this.updateModal({
          title: "解释失败",
          content: data.error || "抱歉，无法解释这个短语。请稍后再试。",
          examples: []
        })
      }
    } catch (error) {
      console.error("Phrase explain error:", error)
      this.updateModal({
        title: "网络错误",
        content: "请检查网络连接后重试。",
        examples: []
      })
    }
  }

  // 显示模态框
  showModal(text) {
    // 更新选中文本显示
    const selectedTextEl = document.getElementById("phrase-explain-selected-text")
    if (selectedTextEl) {
      selectedTextEl.textContent = text
    }

    // 显示加载状态，隐藏内容
    const loadingEl = document.getElementById("phrase-explain-loading")
    const contentEl = document.getElementById("phrase-explain-content")
    if (loadingEl) loadingEl.classList.remove("hidden")
    if (contentEl) contentEl.classList.add("hidden")

    // 显示模态框
    const modal = document.getElementById("phraseExplainModal")
    if (modal) {
      modal.showModal()
    }
  }

  // 更新模态框内容
  updateModal(explanation) {
    if (!explanation) {
      explanation = {
        title: "解释失败",
        content: "无法获取解释内容",
        examples: [],
        usage: ""
      }
    }

    // 隐藏加载状态，显示内容
    const loadingEl = document.getElementById("phrase-explain-loading")
    const contentEl = document.getElementById("phrase-explain-content")
    if (loadingEl) loadingEl.classList.add("hidden")
    if (contentEl) contentEl.classList.remove("hidden")

    // 更新标题
    const titleEl = document.getElementById("phrase-explain-title")
    if (titleEl) {
      titleEl.textContent = explanation.title || "短语解释"
    }

    // 更新文本内容
    const textEl = document.getElementById("phrase-explain-text")
    if (textEl) {
      textEl.textContent = explanation.content || ""
    }

    // 更新示例
    const examplesEl = document.getElementById("phrase-explain-examples")
    const examplesListEl = document.getElementById("phrase-explain-examples-list")
    if (examplesEl && examplesListEl) {
      if (explanation.examples && explanation.examples.length > 0) {
        examplesEl.classList.remove("hidden")
        examplesListEl.innerHTML = ""

        explanation.examples.forEach(example => {
          const exampleDiv = document.createElement("div")
          exampleDiv.className = "bg-base-200 p-4 rounded-lg"
          exampleDiv.innerHTML = `
            <div class="text-sm text-primary mb-2">${this.escapeHtml(example.english || example.text || "")}</div>
            ${example.chinese ? `<div class="text-sm text-base-content/70">${this.escapeHtml(example.chinese)}</div>` : ""}
          `
          examplesListEl.appendChild(exampleDiv)
        })
      } else {
        examplesEl.classList.add("hidden")
      }
    }

    // 更新使用说明
    const usageEl = document.getElementById("phrase-explain-usage")
    if (usageEl) {
      if (explanation.usage) {
        usageEl.classList.remove("hidden")
        const pEl = usageEl.querySelector("p")
        if (pEl) {
          pEl.textContent = explanation.usage
        }
      } else {
        usageEl.classList.add("hidden")
      }
    }
  }

  // 防抖函数
  debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  // HTML转义
  escapeHtml(text) {
    if (text == null) return ""
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }
    return String(text).replace(/[&<>"']/g, (m) => map[m])
  }
}
