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
    document.removeEventListener("selectionchange", this.handleSelectionEnd.bind(this))
    this.selectedText = ""
  }

  // 设置文本选择监听
  setupTextSelectionListener() {
    document.addEventListener("selectionchange", this.debounce(this.checkTextSelection.bind(this), 100))
  }

  // 检查文本选择
  checkTextSelection() {
    const selectedText = this.getSelectedText()

    if (!this.isValidSelectedText(selectedText)) {
      this.removeFloatingIcon()
      return
    }

    if (!this.isElementInControllerScope()) {
      this.removeFloatingIcon()
      return
    }

    this.showFloatingIcon()
  }

  /**
   * 获取当前选中的文本内容
   * @returns {string} 选中的文本内容
   */
  getSelectedText() {
    const selection = window.getSelection()
    return selection.toString().trim()
  }

  /**
   * 判断选中的文本是否有效（长度不少于3个字符）
   * @param {string} text - 待验证的文本
   * @returns {boolean} 是否为有效文本
   */
  isValidSelectedText(text) {
    return text.length >= 3
  }

  /**
   * 获取选中文本所在的DOM元素
   * @returns {Element|null} 选中文本所在的DOM元素，如果不存在则返回null
   */
  getSelectedElement() {
    const selection = window.getSelection()
    if (selection.rangeCount === 0) return null

    const range = selection.getRangeAt(0)
    return this.getElementFromRange(range)
  }

  /**
   * 从Range对象中获取对应的DOM元素
   * @param {Range} range - Range对象
   * @returns {Element|null} 对应的DOM元素
   */
  getElementFromRange(range) {
    const container = range.commonAncestorContainer

    // 如果容器是文本节点(nodeType === 3)，返回其父元素
    // 如果容器是元素节点(nodeType === 1)，直接返回该元素
    if (container.nodeType === Node.TEXT_NODE) {
      return container.parentElement
    } else if (container.nodeType === Node.ELEMENT_NODE) {
      return container
    }

    return null
  }

  /**
   * 判断指定元素是否在当前控制器的作用范围内
   * @returns {boolean} 元素是否在当前控制器范围内
   */
  isElementInControllerScope() {
    let element = this.getSelectedElement()
    if (!element) return false
    return this.element.contains(element)
  }

  // 显示悬浮图标
  showFloatingIcon() {
    this.removeFloatingIcon()

    this.selectedText = this.getSelectedText()

    this.floatingIcon = this.createFloatingIconElement()

    document.body.appendChild(this.floatingIcon)
  }

  /**
   * 创建悬浮图标元素
   * @returns {HTMLDivElement} 悬浮图标DOM元素
   */
  createFloatingIconElement() {
    const icon = document.createElement("div")

    // 设置样式类名
    icon.className = "fixed p-2 rounded-lg bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors duration-200 cursor-pointer shadow-lg z-40"

    // 设置最小尺寸
    icon.style.minWidth = "36px"
    icon.style.minHeight = "36px"

    // 设置位置（固定在右下角）
    this.setPosition(icon)

    // 设置图标内容
    icon.innerHTML = this.getIconSVG()

    // 添加点击事件处理器
    icon.addEventListener("click", this.handleIconClick.bind(this))

    return icon
  }

  /**
   * 设置悬浮图标的定位
   * @param {HTMLElement} element - 悬浮图标元素
   */
  setPosition(element) {
    const DARK_MODE_BUTTON_HEIGHT = 36 // 暗色模式按钮高度
    const SPACING = 10                 // 间距
    const MARGIN = 16                  // 边距

    const bottomPosition = MARGIN + DARK_MODE_BUTTON_HEIGHT + SPACING

    element.style.right = `${MARGIN}px`
    element.style.bottom = `${bottomPosition}px`
  }

  /**
   * 获取图标SVG内容
   * @returns {string} 图标SVG字符串
   */
  getIconSVG() {
    return `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5 text-white">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
    `
  }

  /**
   * 移除悬浮图标
   */
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

    if (!this.isValidSelectedText(selectedText)) {
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
