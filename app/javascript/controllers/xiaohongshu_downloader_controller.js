import { Controller } from "@hotwired/stimulus";
import { post } from "@rails/request.js";

export default class extends Controller {
  static targets = ["input", "form", "resultArea", "button"];

  connect() {
  }

  async download(event) {
    event.preventDefault();

    const shareText = this.inputTarget.value.trim();
    if (!shareText || !this.containsXhsLink(shareText)) {
      window.showNotification("分享内容中未找到小红书链接", "error");
      return;
    }

    if (!confirm("确定要解析这个小红书视频吗？")) {
      return;
    }

    this.setButtonLoading(true);

    try {
      const response = await post("/xhs_parse", {
        body: { url: shareText },
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
          window.showNotification(data.message || "下载成功，正在跳转...", "success");
          setTimeout(() => {
            window.location.href = data.redirect_to;
          }, 500);
        } else {
          window.showNotification("视频下载成功！", "success");
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

  containsXhsLink(text) {
    const xhsKeywords = ["xhslink.com", "xiaohongshu.com", "xiaohongshu"];
    return xhsKeywords.some((keyword) => text.includes(keyword));
  }

  setButtonLoading(loading) {
    if (!this.hasButtonTarget) return;

    const isLoading = loading;
    this.buttonTarget.disabled = isLoading;

    // 保存完整的初始样式类
    const initialClasses = [
      "ml-3",
      "bg-blue-500",
      "text-white",
      "rounded-full",
      "p-2",
      "hover:bg-blue-600",
      "focus:outline-none",
      "cursor-pointer",
      "transition-all",
      "duration-200",
    ];
    const loadingClasses = ["opacity-75", "cursor-not-allowed", "bg-blue-400"];

    if (isLoading) {
      this.buttonTarget.classList.remove("hover:bg-blue-600");
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

}
