/**
 * 单词查询和弹窗系统功能
 * 处理单词查询和多层弹窗显示
 */
export class WordLookup {
  constructor() {
    // 单词查询历史记录系统
    this.wordDialog = document.getElementById("wordInfo");
    this.wordBackBtn = document.getElementById("wordBackBtn");
    this.wordCloseBtn = document.getElementById("wordCloseBtn");

    // 初始化历史记录
    this.initWordHistory();
  }

  // 初始化单词查询功能
  setupWordLookup() {
    // 设置事件监听
    this.setupWordHistoryEvents();
  }

  // 初始化单词查询历史记录
  initWordHistory() {
    if (!this.wordDialog) return;

    // 初始化历史记录数据
    this.wordDialog.dataset.wordHistory = JSON.stringify([]);
    this.wordDialog.dataset.currentIndex = "0";
  }

  // 设置单词历史记录事件监听
  setupWordHistoryEvents() {
    if (!this.wordDialog || !this.wordBackBtn || !this.wordCloseBtn) return;

    // 回退按钮事件
    this.wordBackBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.goBackToPreviousWord();
    });

    // 关闭按钮事件 - 清空历史记录
    this.wordCloseBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.clearWordHistory();
      this.wordDialog.close();
    });

    // ESC键清空历史记录并关闭
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.wordDialog.open) {
        e.preventDefault();
        this.clearWordHistory();
        this.wordDialog.close();
      }
    });

    // 点击dialog外部清空历史记录并关闭
    this.wordDialog.addEventListener("click", (e) => {
      if (e.target === this.wordDialog) {
        this.clearWordHistory();
        this.wordDialog.close();
      }
    });
  }

  // 添加单词到历史记录
  addToWordHistory(word) {
    const history = JSON.parse(this.wordDialog.dataset.wordHistory || "[]");

    history.push(word);

    this.wordDialog.dataset.wordHistory = JSON.stringify(history);
    this.wordDialog.dataset.currentIndex = (history.length - 1).toString();

    this.updateBackButtonVisibility();
  }

  // 回退到上一个单词
  goBackToPreviousWord() {
    const history = JSON.parse(this.wordDialog.dataset.wordHistory || "[]");
    const currentIndex = parseInt(this.wordDialog.dataset.currentIndex || "0");
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      const previousWord = history[newIndex];

      this.wordDialog.dataset.currentIndex = newIndex.toString();

      this.wordDialog.dataset.wordHistory = JSON.stringify(history.slice(0, newIndex + 1));

      this.updateBackButtonVisibility();

      // 重新查询上一个单词
      this.lookupWordByHistory(previousWord);
    }
  }

  // 通过历史查询单词（不添加到历史记录）
  async lookupWordByHistory(word) {
    this.showLoadingMessage();

    try {
      const response = await fetch("/word_lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": this.getCSRFToken(),
        },
        body: JSON.stringify({ word: word }),
      });

      const data = await response.json();
      if (data.success && data.word) {
        const processDef = (text, skipEnglish = false) => this.processDefinitionText(text, skipEnglish, this.escapeHtmlFunc);
        this.showPopupDefinition(null, data.word, word, processDef);
      } else {
        this.showErrorMessage('未找到单词释义');
      }
    } catch (error) {
      console.error('WordLookup: Error during history lookup:', error);
      this.showErrorMessage('查询失败，请稍后重试');
    }
  }

  // 更新回退按钮可见性
  updateBackButtonVisibility() {
    const currentIndex = parseInt(this.wordDialog.dataset.currentIndex || "0");

    if (currentIndex > 0) {
      this.wordBackBtn.classList.remove("hidden");
    } else {
      this.wordBackBtn.classList.add("hidden");
    }
  }

  // 清空历史记录
  clearWordHistory() {
    console.log('clearWorkdHsitasd')
    this.wordDialog.dataset.wordHistory = JSON.stringify([]);
    this.wordDialog.dataset.currentIndex = "0";
    this.updateBackButtonVisibility();
  }

  // 异步查询单词释义
  async lookupWord(word) {
    // 检查是否已经有历史记录
    const history = JSON.parse(this.wordDialog.dataset.wordHistory || "[]");

    if (history.length === 0) {
      this.clearWordHistory();
    }

    this.addToWordHistory(word);

    // 立即显示弹窗
    this.wordDialog.showModal();

    // 显示加载状态
    this.showLoadingMessage();

    try {
      // 发送查询请求到后端API
      const response = await fetch("/word_lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": this.getCSRFToken(),
        },
        body: JSON.stringify({ word: word }),
      });
      const data = await response.json();
      if (data.success && data.word) {
        const processDef = (text, skipEnglish = false) => this.processDefinitionText(text, skipEnglish, this.escapeHtmlFunc);
        this.showPopupDefinition(null, data.word, word, processDef);
      } else {
        // 请求失败但无网络错误
        this.showErrorMessage('未找到单词释义');
      }
    } catch (error) {
      // 网络错误或其他异常
      console.error('WordLookup: Error during lookup:', error);
      this.showErrorMessage('查询失败，请稍后重试');
    }
  }

  // 显示加载状态
  showLoadingMessage() {
    const contentElement = document.querySelector('#wordDetail');
    if (contentElement) {
      contentElement.innerHTML = `
        <div class="text-center text-gray-500 dark:text-gray-400 py-8">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <p class="mt-2 text-sm">查询中...</p>
        </div>
      `;
    }
  }

  // 显示错误信息
  showErrorMessage(message) {
    const contentElement = document.querySelector('#wordDetail');
    if (contentElement) {
      contentElement.innerHTML = `
        <div class="text-center text-gray-500 dark:text-gray-400 py-8">
          <svg class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p class="text-sm">${message}</p>
        </div>
      `;
    }
  }

  escapeHtmlFunc(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // 获取CSRF令牌
  getCSRFToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute("content") : "";
  }


  // 显示单词释义
  showPopupDefinition(popupId, wordData, sourceWord, processDefinitionText) {
    const contentElement = document.querySelector(`#wordDetail`);

    if (!contentElement) return;

    // 处理英文释义中的单词，使其可点击
    const processedDefinition = wordData.definition
      ? processDefinitionText(wordData.definition)
      : "";

    const processedTranslation = wordData.translation
      ? processDefinitionText(wordData.translation, true) // 中文释义不处理英文单词
      : "";

    const processedDetail = wordData.detail
      ? processDefinitionText(wordData.detail, true) // 详细信息不处理英文单词
      : "";

    const html = `
      <div class="space-y-4">
        <!-- 单词标题 -->
        <div class="text-center border-b border-gray-200 dark:border-gray-700 pb-3">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">${wordData.word}</h2>
          ${wordData.phonetic ? `<p class="text-gray-600 dark:text-gray-400">[${wordData.phonetic}]</p>` : ""}
        </div>
        <!-- 核心词汇标记 -->
        ${
          wordData.core
            ? `
          <div class="flex justify-center">
            <span class="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-full text-sm font-medium">
              ⭐ 核心词汇
            </span>
          </div>
        `
            : ""
        }
        <!-- 英文释义 -->
        ${
          wordData.definition
            ? `
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
              <svg class="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clip-rule="evenodd"/>
              </svg>
              英文释义
            </h3>
            <div class="text-gray-700 dark:text-gray-300 text-sm leading-relaxed bg-gray-50 dark:bg-gray-700 p-3 rounded">
              ${processedDefinition}
            </div>
          </div>
        `
            : ""
        }
        <!-- 中文释义 -->
        ${
          wordData.translation
            ? `
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
              <svg class="w-4 h-4 mr-2 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
              </svg>
              中文释义
            </h3>
            <div class="text-gray-700 dark:text-gray-300 text-sm leading-relaxed bg-green-50 dark:bg-green-900/30 p-3 rounded">
              ${processedTranslation}
            </div>
          </div>
        `
            : ""
        }
        <!-- 详细信息 -->
        ${
          wordData.detail
            ? `
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
              <svg class="w-4 h-4 mr-2 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>
              </svg>
              详细说明
            </h3>
            <div class="text-gray-700 dark:text-gray-300 text-sm leading-relaxed bg-purple-50 dark:bg-purple-900/30 p-3 rounded">
              ${processedDetail}
            </div>
          </div>
        `
            : ""
        }
      </div>
    `;
    contentElement.innerHTML = html;

    // 为新创建的弹窗中的单词添加点击事件
    this.addPopupWordClickListeners();
  }

  // 处理定义文本
  processDefinitionText(text, skipEnglish = false, escapeHtml) {
    if (!text) return "";

    // 如果跳过英文单词处理，只做基本的HTML转义
    if (skipEnglish) {
      return escapeHtml(text)
        .split(";")
        .map((def) => `<div class="mb-1">• ${def.trim()}</div>`)
        .join("");
    }

    // 处理文本中的单词，使其可点击
    return this.tokenizeText(text)
      .map((token) => {
        if (token.type === "word" && token.value.length >= 2) {
          return `<span class="word-lookup-popup inline-block px-0.5 rounded hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900 dark:hover:text-blue-300 cursor-pointer transition-colors duration-150" data-word="${token.value}">${escapeHtml(token.value)}</span>`;
        }
        // 其他情况（标点、中文字符、数字等）直接显示
        return escapeHtml(token.value);
      })
      .join("")
      .split(";")
      .map((def) => `<div class="mb-1">• ${def.trim()}</div>`)
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

  // 添加弹窗单词点击监听器
  addPopupWordClickListeners() {
    const wordElements = document.querySelectorAll(".word-lookup-popup");
    wordElements.forEach((element) => {
      element.addEventListener("click", (e) => {
        e.stopPropagation();

        this.lookupWord(element.dataset.word)
      });
    });
  }

  // 清理函数，关闭弹窗并清理历史记录
  disconnect() {
    if (this.wordDialog && this.wordDialog.open) {
      this.clearWordHistory();
      this.wordDialog.close();
    }
  }
}