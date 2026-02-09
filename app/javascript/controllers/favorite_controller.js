import { Controller } from "@hotwired/stimulus";
import { get, post, destroy } from "@rails/request.js";

/**
 * 单词收藏控制器
 * 处理单词收藏/取消收藏功能
 */
export default class extends Controller {
  static values = {
    wordId: Number,
    favorited: Boolean,
    checkUrl: String,
    createUrl: String,
    destroyUrl: String
  };

  connect() {
    // 默认展示未收藏状态
    this.updateButtonState(false);
    // 检查收藏状态
    this.checkFavoriteStatus();
  }

  // 检查收藏状态
  async checkFavoriteStatus() {
    if (!this.isAuthenticated()) {
      this.updateButtonState(false);
      return;
    }

    try {
      const response = await get(this.checkUrlValue, {
        responseKind: 'json'
      });

      if (response.ok) {
        const data = await response.json;
        this.favoritedValue = data.favorited;
        this.updateButtonState(data.favorited);
      }
    } catch (error) {
      console.error('检查收藏状态失败:', error);
    }
  }

  // 切换收藏状态
  async toggleFavorite(event) {
    event.preventDefault();
    event.stopPropagation();

    // 检查是否登录
    if (!this.isAuthenticated()) {
      alert('该功能只有登录用户可以使用');
      return;
    }

    try {
      if (this.favoritedValue) {
        const response = await destroy(this.destroyUrlValue, {
          responseKind: 'json'
        });

        if (response.ok) {
          const data = await response.json;
          this.favoritedValue = data.favorited;
          this.updateButtonState(data.favorited);
        } else {
          alert('操作失败，请稍后重试');
        }
      } else {
        // 添加收藏
        const response = await post(this.createUrlValue, {
          body: { word_id: this.wordIdValue },
          responseKind: 'json'
        });

        if (response.ok) {
          const data = await response.json;
          this.favoritedValue = data.favorited;
          this.updateButtonState(data.favorited);
        } else {
          alert('操作失败，请稍后重试');
        }
      }
    } catch (error) {
      console.error('切换收藏状态失败:', error);
      alert('操作失败，请稍后重试');
    }
  }

  // 更新按钮状态
  updateButtonState(favorited) {
    if (favorited) {
      this.element.classList.add('text-yellow-500', 'fill-yellow-500');
      this.element.classList.remove('text-gray-400', 'fill-gray-400');
    } else {
      this.element.classList.remove('text-yellow-500', 'fill-yellow-500');
      this.element.classList.add('text-gray-400', 'fill-gray-400');
    }
  }

  // 检查是否登录
  isAuthenticated() {
    const meta = document.querySelector('meta[name="user-authenticated"]');
    return meta && meta.getAttribute('content') === 'true';
  }
}
