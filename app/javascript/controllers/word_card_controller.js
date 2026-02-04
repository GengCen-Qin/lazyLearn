import { Controller } from "@hotwired/stimulus";

/**
 * 单词卡片控制器
 * 处理单词卡片的点击事件，显示单词详情模态框
 */
export default class extends Controller {
  static values = {
    word: String
  };

  showWordDetail(event) {
    window.lookupWord(this.wordValue);
  }

  stopPropagation(event) {
    // 阻止点击收藏按钮时触发卡片的点击事件
    event.stopPropagation();
  }
}
