/**
 * 工具函数
 * 提供格式化时间、转义HTML、显示消息等通用功能
 */
export class Utils {
  // 格式化时间
  formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }

  // 格式化文件大小
  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // 转义HTML
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // 处理字幕文本，使英文单词可点击
  processSubtitleText(text, escapeHtml) {
    // 使用改进的词法分析来正确处理标点符号
    return this.tokenizeText(text)
      .map((token) => {
        // 只对长度>=2的英文单词添加点击功能
        if (token.type === "word" && token.value.length >= 2) {
          return `<span class="word-lookup-popup inline-block px-0.5 rounded hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900 dark:hover:text-blue-300 cursor-pointer transition-colors duration-150" data-word="${token.value}">${escapeHtml(token.value)}</span>`;
        }
        // 其他情况（标点、中文字符、数字等）直接显示
        return escapeHtml(token.value);
      })
      .join("");
  }

  // 文本分词器
  tokenizeText(text) {
    const tokens = [];
    // 正则表达式匹配：英文单词 | 中文字符 | 数字 | 标点符号 | 空白字符
    const regex = /([a-zA-Z]+)|([\u4e00-\u9fff]+)|(\d+)|([^\w\s\u4e00-\u9fff])|(\s+)/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const [
        fullMatch,
        englishWord, // 英文单词
        chineseChars, // 中文字符
        numbers, // 数字
        punctuation, // 标点符号
        whitespace, // 空白字符
      ] = match;

      if (englishWord) {
        tokens.push({ type: "word", value: englishWord });
      } else if (chineseChars) {
        tokens.push({ type: "chinese", value: chineseChars });
      } else if (numbers) {
        tokens.push({ type: "number", value: numbers });
      } else if (punctuation) {
        tokens.push({ type: "punctuation", value: punctuation });
      } else if (whitespace) {
        tokens.push({ type: "whitespace", value: whitespace });
      }
    }

    return tokens;
  }

  // 显示成功消息
  showSuccess(message, element) {
    this.showMessage(message, "success", element);
  }

  // 显示错误消息
  showError(message, element) {
    this.showMessage(message, "error", element);
  }

  // 显示消息
  showMessage(message, type = "success", element) {
    // 移除现有消息
    const existingMessages = element.querySelectorAll(".success, .error");
    existingMessages.forEach((msg) => msg.remove());
    // 创建新消息元素
    const messageDiv = document.createElement("div");
    messageDiv.className = type;
    messageDiv.textContent = message;
    // 设置消息样式
    messageDiv.style.cssText = `
      padding: 10px 15px;
      margin: 10px 0;
      border-radius: 5px;
      font-size: 14px;
      font-weight: 500;
      ${
        type === "success"
          ? "background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb;"
          : "background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;"
      }
    `;
    // 添加到容器顶部
    const fileSection = element.querySelector(".file-section");
    if (fileSection) {
      fileSection.insertBefore(messageDiv, fileSection.firstChild);
    } else {
      element.insertBefore(messageDiv, element.firstChild);
    }
    // 3秒后自动移除
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.remove();
      }
    }, 3000);
  }

  // 更新状态栏
  updateStatusBar(hasCurrentTimeTarget, currentTimeTarget, getCurrentTime, hasCurrentSubtitleIndexTarget,
    currentSubtitleIndexTarget, currentIndexValue, subtitlesValue, formatTime) {
    // 更新当前时间显示
    if (hasCurrentTimeTarget) {
      currentTimeTarget.textContent = formatTime(getCurrentTime());
    }
    // 更新当前字幕索引
    if (hasCurrentSubtitleIndexTarget) {
      const current = currentIndexValue;
      const total = subtitlesValue.length;
      if (current >= 0 && total > 0) {
        currentSubtitleIndexTarget.textContent = `${
          current + 1
        } / ${total}`;
      } else {
        currentSubtitleIndexTarget.textContent = `- / ${total}`;
      }
    }
  }
}