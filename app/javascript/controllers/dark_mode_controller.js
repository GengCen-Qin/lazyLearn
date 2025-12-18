import { Controller } from "@hotwired/stimulus";

/**
 * 暗色模式控制器
 * 管理网站暗色模式的切换和状态保存
 */
export default class extends Controller {
  static targets = ["toggle"];

  connect() {
    this.initializeDarkMode();
  }

  disconnect() {
    console.log('Disconnected');
  }

  /**
   * 初始化暗色模式状态
   */
  initializeDarkMode() {
    const darkMode = localStorage.getItem("darkMode");

    if (
      darkMode === "true" || window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
    }
  }


  /**
   * 切换暗色模式
   */
  toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("darkMode", isDark);

    // 设置 DaisyUI 主题
    if (isDark) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
    }

    // 触发自定义事件，通知其他组件暗色模式已切换
    window.dispatchEvent(
      new CustomEvent("darkModeChanged", { detail: { isDark } }),
    );
  }

  /**
   * 获取当前暗色模式状态
   */
  get isDarkMode() {
    return document.documentElement.classList.contains("dark");
  }
}
