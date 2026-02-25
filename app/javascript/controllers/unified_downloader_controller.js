import { Controller } from "@hotwired/stimulus";
import { post } from "@rails/request.js";

export default class extends Controller {
  static targets = ["input", "form", "resultArea", "button"];

  connect() {
  }

  async process(event) {
    event.preventDefault();

    const input = this.inputTarget.value.trim();
    if (!input) {
      window.showNotification("请输入要处理的网址或单词", "error");
      return;
    }

    // 检测输入类型
    const inputType = this.detectInputType(input);

    if (inputType === 'word') {
      // 处理单词查询
      window.lookupWord(input, true);
    } else if (inputType === 'url') {
      // 处理视频下载
      await this.processVideoDownload(input);
    } else {
      window.showNotification("输入格式无法识别", "error");
    }
  }

  // 处理视频下载
  async processVideoDownload(url) {
    const platformName = this.detectPlatform(url) === 'xhs' ? '小红书' : 'Bilibili';
    if (!confirm(`确定要解析这个${platformName}内容吗？`)) {
      return;
    }

    this.setButtonLoading(true);

    try {
      const response = await post("/downloads", {
        body: { url },
        responseKind: 'json'
      });

      const data = await response.json;

      // 处理需要登录的情况
      if (data.need_login) {
        window.showNotification(data.error || "请先登录", "error");
        setTimeout(() => {
          window.location.href = data.redirect_to || "/session/new";
        }, 500);
        return;
      }

      if (data.success) {
        if (data.redirect_to) {
          const platformName = data.platform === 'xhs' ? '视频' : '音频';
          const message = data.message || `${platformName}正在解析，正在跳转...`;
          window.showNotification(message, "success");
          setTimeout(() => {
            window.location.href = data.redirect_to;
          }, 500);
        } else {
          const platformName = data.platform === 'xhs' ? '视频' : '音频';
          window.showNotification(`${platformName}下载成功！`, "success");
        }
      } else {
        window.showNotification(data.error || "下载失败", "error");
      }
    } catch (error) {
      window.showNotification(`网络错误: ${error.message}`, "error");
    } finally {
      this.setButtonLoading(false);
    }
  }

  // 显示单词弹窗
  showWordModal() {
    const modal = document.getElementById('wordInfo');
    if (modal) {
      modal.showModal();
    }
  }

  // 检测输入类型（单词或URL）
  detectInputType(input) {
    // 首先检测是否为单词
    if (this.isWord(input)) {
      return 'word';
    }

    // 然后检测是否为URL
    const platform = this.detectPlatform(input);
    if (platform) {
      return 'url';
    }

    return null;
  }

  // 检测是否为英文单词
  isWord(input) {
    const wordPattern = /^[a-zA-Z]{1,50}$/;
    return wordPattern.test(input.trim());
  }

  // 检测URL平台类型
  detectPlatform(url) {
    const xhsPatterns = [/xhslink\.com/, /xiaohongshu\.com/];
    const bilibiliPatterns = [/bilibili\.com\/video\/(BV|av|AV)/i];

    if (xhsPatterns.some(pattern => pattern.test(url))) {
      return 'xhs';
    } else if (bilibiliPatterns.some(pattern => pattern.test(url))) {
      return 'bilibili';
    }

    return null;
  }

  setButtonLoading(loading) {
    if (!this.hasButtonTarget) return;

    const isLoading = loading;
    this.buttonTarget.disabled = isLoading;

    // 保存完整的初始样式类
    const initialClasses = [
      "ml-4",
      "bg-blue-500",
      "hover:bg-blue-600",
      "dark:bg-blue-600",
      "dark:hover:bg-blue-700",
      "text-white",
      "rounded-full",
      "p-3",
      "focus:outline-none",
      "cursor-pointer",
      "transition-all",
      "duration-200",
    ];
    const loadingClasses = ["opacity-75", "cursor-not-allowed", "bg-blue-400"];

    if (isLoading) {
      this.buttonTarget.classList.remove("hover:bg-blue-600", "dark:hover:bg-blue-700");
      this.buttonTarget.classList.add(...loadingClasses);
      this.buttonTarget.innerHTML = this.getLoadingIcon();
    } else {
      this.buttonTarget.classList.remove(...loadingClasses);
      // 确保恢复所有初始类
      this.buttonTarget.className = initialClasses.join(" ");
      this.buttonTarget.innerHTML = this.getSearchIcon();
    }
  }

  getLoadingIcon() {
    return `<svg class="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>`;
  }

  getSearchIcon() {
    return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>`;
  }

}
