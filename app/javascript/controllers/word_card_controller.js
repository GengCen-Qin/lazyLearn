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
    // 查找页面上的单词查询模态框
    const wordInfoDialog = document.getElementById("wordInfo");

    if (wordInfoDialog) {
      const wordLookupController = this.application.getControllerForElementAndIdentifier(
        wordInfoDialog,
        "word-lookup"
      );

      if (wordLookupController) {
        // 调用 word-lookup 控制器的 lookupWord 方法
        wordLookupController.lookupWord(this.wordValue);
      }
    }
  }

  stopPropagation(event) {
    // 阻止点击收藏按钮时触发卡片的点击事件
    event.stopPropagation();
  }
}