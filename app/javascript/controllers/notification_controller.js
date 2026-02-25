import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  connect() {
    // 监听全局通知事件
    window.addEventListener("notification:show", this.handleNotification.bind(this))
  }

  disconnect() {
    window.removeEventListener("notification:show", this.handleNotification.bind(this))
  }

  handleNotification(event) {
    const { message, type = "info", duration = 3000 } = event.detail
    this.show(message, type, duration)
  }

  show(message, type = "info", duration = 3000) {
    // 创建通知元素
    const notification = document.createElement("div")
    notification.className = `notification notification-${type} flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg min-w-[300px] max-w-md`
    notification.innerHTML = `
      <div class="flex-shrink-0">${this.getIcon(type)}</div>
      <span class="flex-1">${this.escapeHtml(message)}</span>
      <button data-action="click->notification#close" class="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    `

    // 添加动画类
    notification.style.animation = "notificationSlideIn 0.3s ease-out forwards"

    // 动态添加样式（如果还没有）
    this.addStyles()

    // 找到或创建容器
    let container = document.getElementById("notification-container")
    if (!container) {
      container = document.createElement("div")
      container.id = "notification-container"
      container.className = "fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] flex flex-col gap-2"
      document.body.appendChild(container)
    }

    container.appendChild(notification)

    // 自动移除
    if (duration > 0) {
      setTimeout(() => {
        this.removeWithAnimation(notification)
      }, duration)
    }
  }

  close(event) {
    const notification = event.target.closest(".notification")
    if (notification) {
      this.removeWithAnimation(notification)
    }
  }

  removeWithAnimation(element) {
    if (!element || !element.parentNode) return

    element.style.animation = "notificationSlideOut 0.3s ease-out forwards"
    setTimeout(() => {
      if (element.parentNode) {
        element.remove()
      }
    }, 300)
  }

  getIcon(type) {
    const icons = {
      success: `<svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>`,
      error: `<svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>`,
      warning: `<svg class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
      </svg>`,
      info: `<svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>`
    }
    return icons[type] || icons.info
  }

  escapeHtml(text) {
    const div = document.createElement("div")
    div.textContent = text
    return div.innerHTML
  }

  addStyles() {
    if (document.getElementById("notification-styles")) return

    const style = document.createElement("style")
    style.id = "notification-styles"
    style.textContent = `
      .notification {
        animation: notificationSlideIn 0.3s ease-out forwards;
      }
      .notification-success {
        background-color: rgb(240, 253, 244);
        border: 1px solid rgb(187, 247, 208);
      }
      .notification-error {
        background-color: rgb(254, 242, 242);
        border: 1px solid rgb(254, 202, 202);
      }
      .notification-warning {
        background-color: rgb(254, 249, 195);
        border: 1px solid rgb(254, 240, 138);
      }
      .notification-info {
        background-color: rgb(239, 246, 255);
        border: 1px solid rgb(191, 219, 254);
      }
      @media (prefers-color-scheme: dark) {
        .notification-success {
          background-color: rgba(34, 197, 94, 0.1);
          border-color: rgba(34, 197, 94, 0.3);
        }
        .notification-success span { color: rgb(34, 197, 94); }
        .notification-error {
          background-color: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
        }
        .notification-error span { color: rgb(248, 113, 113); }
        .notification-warning {
          background-color: rgba(234, 179, 8, 0.1);
          border-color: rgba(234, 179, 8, 0.3);
        }
        .notification-warning span { color: rgb(250, 204, 21); }
        .notification-info {
          background-color: rgba(59, 130, 246, 0.1);
          border-color: rgba(59, 130, 246, 0.3);
        }
        .notification-info span { color: rgb(96, 165, 250); }
      }
      @keyframes notificationSlideIn {
        0% { opacity: 0; transform: translateY(-20px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      @keyframes notificationSlideOut {
        0% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-20px); }
      }
    `
    document.head.appendChild(style)
  }
}

// 便捷函数：全局发送通知
window.showNotification = function(message, type = "info", duration = 3000) {
  window.dispatchEvent(new CustomEvent("notification:show", {
    detail: { message, type, duration }
  }))
}
