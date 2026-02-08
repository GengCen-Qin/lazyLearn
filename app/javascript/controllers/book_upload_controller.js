import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="book-upload"
export default class extends Controller {
  static targets = ["fileInput", "titleInput"]

  connect() {
    // 添加文件选择监听器
    this.fileInputTarget.addEventListener('change', (e) => {
      this.handleFileSelect(e)
    })
  }

  // 处理文件选择
  handleFileSelect(event) {
    const fileInput = event.target
    const file = fileInput.files[0]
    if (!file) return

    // 验证文件类型
    if (file.type !== 'text/plain') {
      alert('只支持上传 TXT 格式的文件')
      fileInput.value = ''
      return
    }

    // 验证文件大小 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('文件大小不能超过 10MB')
      fileInput.value = ''
      return
    }

    // 设置书名（文件名去掉扩展名）
    const fileName = file.name.replace(/\.[^/.]+$/, "")
    this.titleInputTarget.value = fileName

    // 自动提交表单
    fileInput.form.submit()
  }
}
