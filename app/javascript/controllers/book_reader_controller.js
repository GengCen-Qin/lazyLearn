import { Controller } from "@hotwired/stimulus"
import { post } from "@rails/request.js"

// 图书阅读器控制器
// 实现功能：
// 1. 初始加载指定范围的内容
// 2. 滚动时动态加载更多内容
// 3. 监听滚动事件并同步阅读进度
// 4. 刷新页面后恢复上次阅读位置
export default class extends Controller {
  static targets = ["contentArea", "turboFrame", "progress"]

  static values = {
    bookId: Number,           // 书籍ID
    totalLines: Number,       // 总行数
    startLine: Number,        // 开始行（从上次阅读位置恢复）
    endLine: Number,          // 结束行（从上次阅读位置恢复）
    limit: { type: Number, default: 50 }  // 每次加载的行数限制
  }

  /**
   * 初始化控制器
   */
  connect() {
    // 初始化状态变量
    this.initState()

    // 绑定事件处理器
    this.bindEventHandlers()

    // 初始化 Intersection Observer
    this.initIntersectionObserver()

    // 执行初始化逻辑
    this.performInitialization()
  }

  /**
   * 初始化状态变量
   */
  initState() {
    this.debounceTimer = null      // 防抖定时器
    this.isLoading = false         // 是否正在加载内容

    // 当前显示的起始行和结束行
    this.currentStartLine = this.startLineValue || 1
    this.currentEndLine = this.endLineValue || Math.min(this.totalLinesValue || 50, 50)

    // 上次保存的进度位置
    this.lastSavedStartLine = this.currentStartLine
    this.lastSavedEndLine = this.currentEndLine

    // Intersection Observer 实例
    this.intersectionObserver = null

    // DOM 变化监听器实例
    this.mutationObserver = null
  }

  /**
   * 绑定事件处理器
   */
  bindEventHandlers() {
    this.handleScrollBound = this.handleScroll.bind(this)
  }


  /**
   * 初始化 Intersection Observer
   * 用于检测哪些行在可视区域内
   */
  initIntersectionObserver() {
    // 配置 Intersection Observer 选项
    const options = {
      root: this.contentAreaTarget,  // 观察的根元素
      rootMargin: '0px',             // 根边距
      threshold: 0.1                 // 至少10%可见时触发回调
    }

    // 创建 Intersection Observer 实例
    this.intersectionObserver = new IntersectionObserver((entries) => {
      this.handleIntersection(entries)
    }, options)
  }

  /**
   * 初始化 DOM 变化监听器
   * 用于监听后端通过 Turbo Stream 更新的状态
   */
  initMutationObserver() {
    // 配置 DOM 变化监听器选项
    const config = {
      childList: true,  // 监听子节点变化
      subtree: true     // 监听整个子树
    }

    // 创建 DOM 变化监听器实例
    this.mutationObserver = new MutationObserver((mutationsList) => {
      mutationsList.forEach((mutation) => {
        if (mutation.type === 'childList') {
          this.updateLoadingStatus()
        }
      })
    })

    // 开始监听状态容器的变化
    const statusContainer = document.getElementById('loading-status')
    if (statusContainer) {
      this.mutationObserver.observe(statusContainer, config)
    }
  }


  /**
   * 更新加载状态
   * 从 DOM 中读取最新的 hasMoreBefore 和 hasMoreAfter 状态
   */
  updateLoadingStatus() {
    const statusDataElement = document.getElementById('book-status-data')

    if (statusDataElement) {
      try {
        const statusData = JSON.parse(statusDataElement.textContent)

        if (typeof statusData.has_more_before !== 'undefined') {
          this.hasMoreBefore = statusData.has_more_before
        }

        if (typeof statusData.has_more_after !== 'undefined') {
          this.hasMoreAfter = statusData.has_more_after
        }
      } catch (error) {
        console.error('解析状态数据失败:', error)
      }
    }
  }

  /**
   * 处理元素交叉事件
   * @param {Array} entries - 交叉观察器条目数组
   */
  handleIntersection(entries) {
    // 获取当前可见的行号
    const visibleLines = []

    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // 获取元素的行号
        const lineNumber = parseInt(entry.target.dataset.lineNumber)
        if (!isNaN(lineNumber)) {
          visibleLines.push(lineNumber)
        }
      }
    })

    if (visibleLines.length > 0) {
      // 更新当前可见的起始行和结束行
      this.currentStartLine = Math.min(...visibleLines)
      this.currentEndLine = Math.max(...visibleLines)
    }
  }

  /**
   * 执行初始化逻辑
   */
  async performInitialization() {
    try {
      // 初始化 DOM 变化监听器
      this.initMutationObserver()

      // 根据上次阅读位置加载内容
      await this.loadInitialContent()

      // 添加滚动监听
      this.contentAreaTarget.addEventListener('scroll', this.handleScrollBound)

      // 开始监控内容行的可见性
      this.observeContentLines()

      // 初始化后立即更新加载状态
      this.updateLoadingStatus()
    } catch (error) {
      console.error('初始化阅读器失败:', error)
      this.showError('加载失败，请刷新页面重试')
    }
  }

  /**
   * 加载初始内容
   * 根据 this.startLineValue 和 this.endLineValue 确定加载范围
   */
  async loadInitialContent() {
    // 使用当前记录的起始行加载内容
    await this.loadContentWithTurboFrame({ startLine: this.currentStartLine })
  }

  /**
   * 使用 Turbo Stream 加载内容
   * @param {Object} params - 加载参数
   * @param {Number} [params.startLine] - 从指定行开始加载（初始加载）
   * @param {Number} [params.beforeLine] - 在指定行之前加载（向上滚动）
   * @param {Number} [params.afterLine] - 在指定行之后加载（向下滚动）
   */
  async loadContentWithTurboFrame(params = {}) {
    if (this.isLoading) return
    this.isLoading = true

    try {
      // 显示加载指示器
      this.showLoadingIndicator()

      // 构建请求URL和参数
      const requestUrl = this.buildRequestUrl(params)

      // 发送请求获取内容
      const response = await post(requestUrl, {
        responseKind: 'turbo-stream'
      })

      if (response.ok) {
        setTimeout(() => {
          this.observeContentLines()
          this.updateLoadingStatus()
        }, 0)
      } else {
        throw new Error('加载内容失败')
      }
    } catch (error) {
      console.error('加载内容错误:', error)
      this.showError('加载内容失败')
    } finally {
      this.isLoading = false
      // 隐藏加载指示器
      this.hideLoadingIndicator()
    }
  }

  /**
   * 构建请求URL和参数
   * @param {Object} params - 加载参数
   * @returns {string} 请求URL
   */
  buildRequestUrl(params) {
    const url = new URL(`/books/${this.bookIdValue}/load_content`, window.location.origin)

    if (params.startLine) {
      url.searchParams.append('start_line', params.startLine)
    } else if (params.beforeLine) {
      url.searchParams.append('before_line', params.beforeLine)
    } else if (params.afterLine) {
      url.searchParams.append('after_line', params.afterLine)
    }

    url.searchParams.append('limit', this.limitValue)
    return url.toString()
  }

  /**
   * 显示加载指示器
   */
  showLoadingIndicator() {
    const loadingContainer = document.getElementById('loading-container')
    if (loadingContainer) {
      loadingContainer.innerHTML = '<div class="flex justify-center py-4"><div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div></div>'
    }
  }

  /**
   * 隐藏加载指示器
   */
  hideLoadingIndicator() {
    const loadingContainer = document.getElementById('loading-container')
    if (loadingContainer) {
      loadingContainer.innerHTML = ''
    }
  }

  /**
   * 滚动事件处理器
   * 1. 检测是否需要加载更多内容
   * 2. 监控内容行的可见性
   * 3. 防抖保存阅读进度
   */
  handleScroll() {
    // 监控内容行的可见性
    this.observeContentLines()

    // 检测是否需要向上加载更多内容
    if (this.shouldLoadMoreBefore()) {
      this.loadContentWithTurboFrame({ beforeLine: this.currentStartLine })
    }

    // 检测是否需要向下加载更多内容
    if (this.shouldLoadMoreAfter()) {
      this.loadContentWithTurboFrame({ afterLine: this.currentEndLine })
    }

    // 防抖保存阅读进度（延时2秒）
    // 仅当可见范围实际发生显著变化时才保存进度
    this.debouncedSaveProgress()
  }

  /**
   * 检测是否需要向上加载更多内容
   * @returns {boolean} 是否需要向上加载
   */
  shouldLoadMoreBefore() {
    const { scrollTop } = this.contentAreaTarget
    return scrollTop === 0 && this.hasMoreBefore && this.currentStartLine > 1 && !this.isLoading
  }

  /**
   * 检测是否需要向下加载更多内容
   * @returns {boolean} 是否需要向下加载
   */
  shouldLoadMoreAfter() {
    const { scrollTop, scrollHeight, clientHeight } = this.contentAreaTarget
    return scrollTop + clientHeight >= scrollHeight - 5 && this.hasMoreAfter && !this.isLoading
  }

  /**
   * 监控内容区域中的行元素
   * 将 Intersection Observer 应用到每一行
   */
  observeContentLines() {
    // 获取所有带行号的数据元素
    const lineElements = this.contentAreaTarget.querySelectorAll('[data-line-number]')

    // 停止观察所有元素
    this.intersectionObserver.disconnect()

    // 开始观察所有行元素
    lineElements.forEach(element => {
      this.intersectionObserver.observe(element)
    })
  }

  /**
   * 防抖保存阅读进度
   * 延迟2秒执行，避免频繁保存
   */
  debouncedSaveProgress() {
    // 检查是否有有意义的位置变化（至少5行差异）
    const hasMeaningfulChange =
      Math.abs(this.currentStartLine - this.lastSavedStartLine) >= 5 ||
      Math.abs(this.currentEndLine - this.lastSavedEndLine) >= 5

    if (!hasMeaningfulChange) {
      // 没有意义的变化，不执行保存
      return
    }

    // 清除之前的定时器
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }

    // 设置新的定时器，2秒后保存进度
    this.debounceTimer = setTimeout(() => {
      this.saveReadingProgress()
    }, 2000)
  }

  /**
   * 保存阅读进度到服务器
   */
  async saveReadingProgress() {
    if (!this.currentStartLine || !this.currentEndLine) {
      return
    }

    try {
      const response = await post(`/books/${this.bookIdValue}/reading_progresses`, {
        body: {
          start_line: this.currentStartLine,
          end_line: this.currentEndLine
        },
        responseKind: 'json'
      })

      if (response.ok) {
        // 更新最后保存的位置
        this.lastSavedStartLine = this.currentStartLine
        this.lastSavedEndLine = this.currentEndLine
      }
    } catch (error) {
      console.error('保存阅读进度失败:', error)
    }
  }

  /**
   * 显示错误信息
   * @param {string} message - 错误消息
   */
  showError(message) {
    this.turboFrameTarget.innerHTML = `
      <div class="text-center text-red-600 dark:text-red-400 py-8">
        <p>${message}</p>
      </div>
    `
  }

  /**
   * 断开连接时清理资源
   */
  disconnect() {
    // 清理定时器
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }

    // 移除事件监听器
    if (this.contentAreaTarget && this.handleScrollBound) {
      this.contentAreaTarget.removeEventListener('scroll', this.handleScrollBound)
    }

    // 断开 Intersection Observer
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect()
    }

    // 断开 Mutation Observer
    if (this.mutationObserver) {
      this.mutationObserver.disconnect()
    }
  }
}
