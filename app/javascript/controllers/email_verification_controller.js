import { Controller } from "@hotwired/stimulus"
import { post } from "@rails/request.js"

export default class extends Controller {
  static targets = ["email", "code", "button", "countdown"]

  connect() {
    this.timer = null
  }

  disconnect() {
    if (this.timer) {
      clearInterval(this.timer)
    }
  }

  // 验证邮箱格式
  validateEmail() {
    const email = this.emailTarget.value
    const isValid = this.emailRegex().test(email)

    if (this.hasButtonTarget) {
      if (!isValid && email.length > 0) {
        this.buttonTarget.disabled = true
      } else if (isValid) {
        this.buttonTarget.disabled = false
      }
    }
  }

  // 发送验证码
  async sendCode() {
    const email = this.emailTarget.value

    if (!this.emailRegex().test(email)) {
      alert("请输入有效的邮箱地址")
      return
    }

    if (!this.hasButtonTarget) return

    this.buttonTarget.disabled = true
    const originalText = this.buttonTarget.textContent
    this.buttonTarget.textContent = "发送中..."

    try {
      const response = await post("/email_verifications", {
        body: { email },
        responseKind: 'json'
      })

      const data = await response.json

      if (data.success) {
        this.startCountdown()
        alert("验证码已发送，请查收邮件")
      } else {
        alert(data.error || "发送失败")
        this.buttonTarget.disabled = false
        this.buttonTarget.textContent = originalText
      }
    } catch (error) {
      console.error("发送验证码失败:", error)
      alert("网络错误，请稍后重试")
      this.buttonTarget.disabled = false
      this.buttonTarget.textContent = originalText
    }
  }

  // 启动倒计时
  startCountdown() {
    if (!this.hasCountdownTarget || !this.hasButtonTarget) return

    let seconds = 60
    this.countdownTarget.style.display = "inline"

    const updateCountdown = () => {
      this.countdownTarget.textContent = `${seconds}秒后可重新获取`
      seconds--

      if (seconds < 0) {
        clearInterval(this.timer)
        this.buttonTarget.disabled = false
        this.buttonTarget.textContent = "获取验证码"
        this.countdownTarget.style.display = "none"
      }
    }

    updateCountdown()
    this.timer = setInterval(updateCountdown, 1000)
  }

  // 工具方法
  emailRegex() {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  }
}
