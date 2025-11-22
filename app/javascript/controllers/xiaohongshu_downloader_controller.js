import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["input", "form", "result_area", "result_content", "button"]

  connect() {
    console.log("Xiaohongshu downloader controller connected")
  }

  async download(event) {
    event.preventDefault()

    const shareText = this.inputTarget.value.trim()

    if (!shareText) {
      this.showError('请输入小红书分享内容')
      return
    }

    // 验证分享文本是否包含链接
    if (!this.containsXhsLink(shareText)) {
      this.showError('分享内容中未找到小红书链接')
      return
    }

    // 确认对话框
    if (!confirm('确定要下载这个小红书视频吗？')) {
      return
    }

    // 显示按钮loading状态
    this.setButtonLoading(true)

    // 发送请求
    try {
      const response = await fetch('/download_xiaohongshu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-Token': document.querySelector('[name="csrf-token"]').content
        },
        body: JSON.stringify({ url: shareText })
      })

      const data = await response.json()

      if (data.success) {
        if (data.redirect_to) {
          // 显示跳转提示，然后进行重定向
          this.showRedirectMessage(data.message || '下载成功，正在跳转...')
          setTimeout(() => {
            window.location.href = data.redirect_to
          }, 1500)
        } else {
          this.showSuccess(data)
        }
      } else {
        this.setButtonLoading(false)
        this.showError(data.error || '下载失败')
      }
    } catch (error) {
      this.setButtonLoading(false)
      this.showError(`网络错误: ${error.message}`)
    }
  }

  containsXhsLink(text) {
    // 检查文本中是否包含小红书链接
    return text.includes('xhslink.com') ||
           text.includes('xiaohongshu.com') ||
           text.includes('xiaohongshu')
  }

  showLoading() {
    if (!this.hasResult_contentTarget || !this.hasResult_areaTarget) {
      return
    }

    this.result_contentTarget.innerHTML = `
      <div class="flex items-center justify-center py-4">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span class="ml-3 text-gray-600">正在解析小红书链接...</span>
      </div>
    `
    this.result_areaTarget.classList.remove('hidden')
  }

  setButtonLoading(loading) {
    if (!this.hasButtonTarget) return

    if (loading) {
      this.buttonTarget.disabled = true
      this.buttonTarget.classList.add('opacity-75', 'cursor-not-allowed', 'bg-blue-400')
      this.buttonTarget.classList.remove('bg-blue-500', 'hover:bg-blue-600')
      this.buttonTarget.innerHTML = `
        <svg class="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      `
    } else {
      this.buttonTarget.disabled = false
      this.buttonTarget.classList.remove('opacity-75', 'cursor-not-allowed', 'bg-blue-400')
      this.buttonTarget.classList.add('bg-blue-500', 'hover:bg-blue-600')
      this.buttonTarget.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      `
    }
  }

  
  showRedirectMessage(message) {
    if (!this.hasResult_contentTarget || !this.hasResult_areaTarget) {
      return
    }

    this.result_contentTarget.innerHTML = `
      <div class="bg-green-50 border border-green-200 rounded-lg p-4">
        <div class="flex items-center">
          <svg class="h-6 w-6 text-green-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="flex-1">
            <h3 class="text-green-800 font-semibold">下载成功！</h3>
            <p class="text-green-700 text-sm mt-1">${message}</p>
          </div>
          <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
        </div>
      </div>
    `
    this.result_areaTarget.classList.remove('hidden')
  }

  showSuccess(data) {
    if (!this.hasResult_contentTarget || !this.hasResult_areaTarget) {
      return
    }

    const title = data.title || '小红书视频'

    this.result_contentTarget.innerHTML = `
      <div class="bg-green-50 border border-green-200 rounded-lg p-4">
        <div class="flex items-center mb-3">
          <svg class="h-6 w-6 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 class="text-green-800 font-semibold">下载成功！</h3>
        </div>
        <p class="text-green-700 font-medium mb-2">${title}</p>
        <p class="text-sm text-gray-600">文件名: ${data.file_name}</p>
        <p class="text-xs text-gray-500 mt-2">视频已保存并开始转录处理</p>
      </div>
    `
    this.result_areaTarget.classList.remove('hidden')
  }

  showError(message) {
    if (!this.hasResult_contentTarget || !this.hasResult_areaTarget) {
      return
    }

    this.result_contentTarget.innerHTML = `
      <p class="text-red-600">${message}</p>
    `
    this.result_areaTarget.classList.remove('hidden')
  }
}