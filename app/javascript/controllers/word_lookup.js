/**
 * 单词查询和弹窗系统功能
 * 处理单词查询和多层弹窗显示
 */
export class WordLookup {
  constructor() {
    // 多层弹窗系统初始化
    this.popupContainer = document.getElementById("wordPopupContainer"); // 弹窗容器
    this.popupTemplate = document.getElementById("wordPopupTemplate"); // 弹窗HTML模板
    this.activePopups = []; // 当前活动的弹窗列表
  }

  // 初始化单词查询功能
  setupWordLookup() {
    // 设置全局事件监听
    this.setupGlobalPopupEvents();
  }

  setupGlobalPopupEvents() {
    // ESC键关闭最上层弹窗
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.activePopups.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        this.closeTopPopup();
      }
    });

    // 点击弹窗外部区域关闭最上层弹窗
    if (this.popupContainer) {
      this.popupContainer.addEventListener("click", (e) => {
        if (e.target === this.popupContainer && this.activePopups.length > 0) {
          this.closeTopPopup();
        }
      });
    }
  }

  // 显示弹窗容器
  showPopupContainer() {
    if (this.popupContainer) {
      this.popupContainer.classList.remove("hidden");
    }
  }

  // 隐藏弹窗容器
  hidePopupContainer() {
    if (this.popupContainer) {
      this.popupContainer.classList.add("hidden");
    }
  }

  // 异步查询单词释义
  async lookupWord(word) {
    // 立即显示弹窗
    document.getElementById('wordInfo').showModal();

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
        <div class="text-center text-gray-500 py-8">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
        <div class="text-center text-gray-500 py-8">
          <svg class="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

  // 创建新弹窗层
  createPopupLayer(word, sourceLayer = 0, showImmediately = true) {
    if (!this.popupTemplate || !this.popupContainer) return null;

    // 克隆HTML模板
    const template = this.popupTemplate.content.cloneNode(true);
    const popupLayer = template.querySelector(".word-popup-layer");

    // 设置唯一ID和层级属性
    const popupId = `word-popup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    popupLayer.id = popupId;
    popupLayer.dataset.word = word;
    popupLayer.dataset.layer = this.activePopups.length;

    // 添加到容器
    this.popupContainer.appendChild(popupLayer);

    // 设置事件监听
    this.setupPopupEvents(popupId, word);

    // 添加到活动弹窗列表
    const popupData = {
      id: popupId,
      word: word,
      element: popupLayer,
      sourceLayer: sourceLayer,
    };
    this.activePopups.push(popupData);

    // 确保容器可见
    if (this.popupContainer.classList.contains("hidden")) {
      this.popupContainer.classList.remove("hidden");
    }

    return popupId;
  }

  // 设置弹窗事件监听器
  setupPopupEvents(popupId, word) {
    const popupLayer = document.getElementById(popupId);
    if (!popupLayer) return;

    // 关闭按钮事件
    const closeBtn = popupLayer.querySelector(".word-popup-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        this.closePopup(popupId);
      });
    }

    // 阻止事件冒泡，避免点击弹窗内容时关闭弹窗
    popupLayer.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }

  // 关闭指定弹窗
  closePopup(popupId) {
    const popupIndex = this.activePopups.findIndex((p) => p.id === popupId);
    if (popupIndex === -1) return;

    const popupData = this.activePopups[popupIndex];

    // 移除DOM元素
    if (popupData.element && popupData.element.parentNode) {
      popupData.element.parentNode.removeChild(popupData.element);
    }

    // 从活动列表中移除
    this.activePopups.splice(popupIndex, 1);

    // 如果没有活动弹窗，隐藏容器
    if (this.activePopups.length === 0) {
      this.hidePopupContainer();
    }
  }

  // 关闭最顶层弹窗
  closeTopPopup() {
    if (this.activePopups.length > 0) {
      const topPopup = this.activePopups[this.activePopups.length - 1];
      this.closePopup(topPopup.id);
    }
  }

  // 显示弹窗加载状态
  showPopupLoading(popupId) {
    const contentElement = document.querySelector(
      `#${popupId} .word-popup-content`,
    );
    if (contentElement) {
      contentElement.innerHTML = `
        <div class="text-center text-gray-500 py-8">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p class="mt-2 text-sm">查询中...</p>
        </div>
      `;
    }
  }

  // 显示弹窗错误状态
  showPopupError(popupId, message) {
    const contentElement = document.querySelector(
      `#${popupId} .word-popup-content`,
    );
    if (contentElement) {
      contentElement.innerHTML = `
        <div class="text-center text-gray-500 py-8">
          <svg class="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p class="text-sm">${message}</p>
        </div>
      `;
    }
  }

  // 显示弹窗（从隐藏状态到可见状态）
  revealPopup(popupId) {
    const popupLayer = document.getElementById(popupId);
    if (!popupLayer) return;

    // 短暂延迟确保DOM已更新
    requestAnimationFrame(() => {
      popupLayer.style.opacity = "1";
      popupLayer.style.pointerEvents = "auto";
    });
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
        <div class="text-center border-b border-gray-200 pb-3">
          <h2 class="text-2xl font-bold text-gray-900 mb-2">${wordData.word}</h2>
          ${wordData.phonetic ? `<p class="text-gray-600">[${wordData.phonetic}]</p>` : ""}
        </div>
        <!-- 核心词汇标记 -->
        ${
          wordData.core
            ? `
          <div class="flex justify-center">
            <span class="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
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
            <h3 class="font-semibold text-gray-900 mb-2 flex items-center">
              <svg class="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clip-rule="evenodd"/>
              </svg>
              英文释义
            </h3>
            <div class="text-gray-700 text-sm leading-relaxed bg-gray-50 p-3 rounded">
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
            <h3 class="font-semibold text-gray-900 mb-2 flex items-center">
              <svg class="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
              </svg>
              中文释义
            </h3>
            <div class="text-gray-700 text-sm leading-relaxed bg-green-50 p-3 rounded">
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
            <h3 class="font-semibold text-gray-900 mb-2 flex items-center">
              <svg class="w-4 h-4 mr-2 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>
              </svg>
              详细说明
            </h3>
            <div class="text-gray-700 text-sm leading-relaxed bg-purple-50 p-3 rounded">
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
          return `<span class="word-lookup-popup inline-block px-0.5 rounded hover:bg-blue-100 hover:text-blue-700 cursor-pointer transition-colors duration-150" data-word="${token.value}">${escapeHtml(token.value)}</span>`;
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

  // 清理函数，关闭所有弹窗
  disconnect() {
    // 关闭所有活动弹窗
    while (this.activePopups.length > 0) {
      this.closeTopPopup();
    }
  }
}