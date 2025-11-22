import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["input", "form", "result_area", "result_content"]

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

    this.showLoading()

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
        this.showSuccess(data)
      } else {
        this.showError(data.error || '下载失败')
      }
    } catch (error) {
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