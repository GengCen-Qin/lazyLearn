import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["input", "form", "result_area", "result_content"]

  connect() {
    console.log("Xiaohongshu downloader controller connected")
  }

  async download(event) {
    event.preventDefault()

    const url = this.inputTarget.value.trim()

    if (!url) {
      this.showError('请输入小红书链接')
      return
    }

    // 验证链接格式
    if (!this.isValidUrl(url)) {
      this.showError('请输入有效的小红书链接')
      return
    }

    // 确认对话框
    if (!confirm('确定要下载这个小红书视频吗？')) {
      return
    }

    // 发送请求
    try {
      // 直接发送URL而不是整个表单
      const response = await fetch('/download_xiaohongshu', {
        method: 'POST',
        body: JSON.stringify({ url: url }),
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-Token': document.querySelector('[name="csrf-token"]').content
        }
      })

      const data = await response.json()

      if (data.success) {
        this.showSuccess(data)
      } else {
        this.showError(data.error || '下载失败')
      }
    } catch (error) {
      this.showError(`发生错误: ${error.message}`)
    }
  }

  isValidUrl(string) {
    try {
      const url = new URL(string)
      return url.hostname.includes('xiaohongshu') ||
             url.hostname.includes('xhscdn.com') // 添加对小红书CDN域名的支持
    } catch (_) {
      return false
    }
  }

  showSuccess(data) {
    this.result_contentTarget.innerHTML = `
      <p class="text-green-600">视频下载成功！</p>
      <p class="mt-2">本地存储路径: ${data.file_path}</p>
      <p class="mt-2 text-sm text-gray-600">文件名: ${data.file_name}</p>
    `
    this.result_areaTarget.classList.remove('hidden')
  }

  showError(message) {
    this.result_contentTarget.innerHTML = `
      <p class="text-red-600">${message}</p>
    `
    this.result_areaTarget.classList.remove('hidden')
  }
}