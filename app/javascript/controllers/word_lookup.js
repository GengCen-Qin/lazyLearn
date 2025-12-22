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
      // 并行调用本地和外部API
      const [localResponse, externalResponse] = await Promise.allSettled([
        fetch("/word_lookup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": this.getCSRFToken(),
          },
          body: JSON.stringify({ word: word }),
        }),
        this.fetchExternalWordData(word)
      ]);

      const localData = localResponse.status === 'fulfilled' ? await localResponse.value.json() : null;
      const externalData = externalResponse.status === 'fulfilled' ? externalResponse.value : null;

      if (localData && localData.success && localData.word) {
        const processDef = (text, skipEnglish = false) => this.processDefinitionText(text, skipEnglish, this.escapeHtmlFunc);
        this.showPopupDefinition(null, localData.word, word, processDef, externalData);
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
      // 并行调用本地和外部API
      const [localResponse, externalResponse] = await Promise.allSettled([
        this.fetchLocalWordData(word),
        this.fetchExternalWordData(word)
      ]);

      const localData = localResponse.status === 'fulfilled' ? await localResponse.value.json() : null;
      const externalData = externalResponse.status === 'fulfilled' ? externalResponse.value : null;

      if (localData && localData.success && localData.word) {
        const processDef = (text, skipEnglish = false) => this.processDefinitionText(text, skipEnglish, this.escapeHtmlFunc);
        this.showPopupDefinition(null, localData.word, word, processDef, externalData);
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

  async fetchLocalWordData(word) {
    return await fetch("/word_lookup", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": this.getCSRFToken(),
              },
              body: JSON.stringify({ word: word }),
            })
  }

  // 调用外部API获取单词数据
  async fetchExternalWordData(word) {
    try {
      const response = await fetch(`https://v2.xxapi.cn/api/englishwords?word=${encodeURIComponent(word)}`);

      if (response.ok) {
        const data = await response.json();

        if (data.code === 200 && data.data) {
          return {
            sentences: data.data.sentences || [],
            ukphone: data.data.ukphone,
            ukspeech: data.data.ukspeech,
            usphone: data.data.usphone,
            usspeech: data.data.usspeech
          };
        }
      }
      return null;
    } catch (error) {
      console.warn('Failed to fetch external word data:', error);
      return null;
    }
  }


  // 显示单词释义
  showPopupDefinition(popupId, wordData, sourceWord, processDefinitionText, externalData = null) {
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

    // 处理音标信息
    const phoneticSection = this.buildPhoneticSection(wordData.phonetic, externalData);

    // 处理词形变化信息
    const wordFormsSection = this.buildWordFormsSection(wordData.word_forms);

    // 处理例句信息
    const sentencesSection = externalData && externalData.sentences && externalData.sentences.length > 0
      ? this.buildSentencesSection(externalData.sentences)
      : '';

    const html = `
      <div class="space-y-4">
        <!-- 单词标题 -->
        <div class="text-center border-b border-gray-200 dark:border-gray-700 pb-3">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">${wordData.word}</h2>
          ${phoneticSection}
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
        <!-- 词形变化 -->
        ${wordFormsSection}
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
        <!-- 例句 -->
        ${sentencesSection}
      </div>
    `;
    contentElement.innerHTML = html;

    // 为新创建的弹窗中的单词添加点击事件
    this.addPopupWordClickListeners();

    // 为发音按钮添加点击事件
    this.addPronunciationListeners();
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

  // 添加发音监听器
  addPronunciationListeners() {
    const pronunciationButtons = document.querySelectorAll(".pronunciation-btn");
    pronunciationButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        const audioUrl = button.dataset.audioUrl;
        if (audioUrl) {
          this.playAudio(audioUrl);
        }
      });
    });
  }

  // 播放音频
  playAudio(audioUrl) {
    try {
      const audio = new Audio(audioUrl);
      audio.play().catch(error => {
        console.warn('Failed to play pronunciation audio:', error);
      });
    } catch (error) {
      console.warn('Failed to create audio element:', error);
    }
  }

  // 构建音标部分
  buildPhoneticSection(localPhonetic, externalData) {
    let phoneticHtml = '';

    // 本地音标
    if (externalData == null && localPhonetic) {
      phoneticHtml += `<p class="text-gray-600 dark:text-gray-400">[${localPhonetic}]</p>`;
    }

    // 外部音标和发音
    if (externalData) {
      const ukPhone = externalData.ukphone;
      const usPhone = externalData.usphone;
      const ukSpeech = externalData.ukspeech;
      const usSpeech = externalData.usspeech;

      if (ukPhone || usPhone || ukSpeech || usSpeech) {
        phoneticHtml += '<div class="flex flex-wrap justify-center items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-2">';

        if (ukPhone) {
          phoneticHtml += `<div class="flex items-center gap-1">`;
          phoneticHtml += `<span class="font-medium">UK:</span> [${ukPhone}]`;
          if (ukSpeech) {
            phoneticHtml += `<button class="pronunciation-btn ml-1 p-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded transition-colors" data-audio-url="${ukSpeech}" title="英式发音">`;
            phoneticHtml += `<svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">`;
            phoneticHtml += `<path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clip-rule="evenodd"/>`;
            phoneticHtml += `</svg></button>`;
          }
          phoneticHtml += `</div>`;
        }

        if (usPhone) {
          phoneticHtml += `<div class="flex items-center gap-1">`;
          phoneticHtml += `<span class="font-medium">US:</span> [${usPhone}]`;
          if (usSpeech) {
            phoneticHtml += `<button class="pronunciation-btn ml-1 p-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded transition-colors" data-audio-url="${usSpeech}" title="美式发音">`;
            phoneticHtml += `<svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">`;
            phoneticHtml += `<path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clip-rule="evenodd"/>`;
            phoneticHtml += `</svg></button>`;
          }
          phoneticHtml += `</div>`;
        }

        phoneticHtml += '</div>';
      }
    }

    return phoneticHtml;
  }

  // 构建词形变化部分
  buildWordFormsSection(wordForms) {
    if (!wordForms || wordForms.length === 0) {
      return '';
    }

    // 按照优先级排序：动词形式 > 名词复数 > 形容词级 > 其他
    const priorityOrder = ['3', 'p', 'd', 'i', 's', 'r', 't', '0', '1'];
    const sortedForms = wordForms.sort((a, b) => {
      const indexA = priorityOrder.indexOf(a.type_code);
      const indexB = priorityOrder.indexOf(b.type_code);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });

    const formsHtml = sortedForms.map(form => {
      const processedForm = this.processDefinitionText(form.form, false, this.escapeHtmlFunc);
      return `
        <div class="flex items-center justify-between gap-1">
          <span class="text-sm text-gray-600 dark:text-gray-400">${form.type}:</span>
          <span data-word="${form.form}">
            ${processedForm}
          </span>
        </div>
      `;
    }).join('');

    return `
      <div>
        <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">词形变化</h3>
        <div class="text-sm leading-relaxed bg-gray-50 dark:bg-gray-700 p-3 rounded">
          ${formsHtml}
        </div>
      </div>
    `;
  }

  // 构建例句部分
  buildSentencesSection(sentences) {
    if (!sentences || sentences.length === 0) {
      return '';
    }

    const sentencesHtml = sentences.map(sentence => {
      const sContent = this.escapeHtmlFunc(sentence.s_content || '');
      const sCn = this.escapeHtmlFunc(sentence.s_cn || '');
      const processDef = (text) => this.processDefinitionText(text, false, this.escapeHtmlFunc);
      const processedContent = processDef(sContent);

      return `
        <div class="border-l-4 border-orange-400 dark:border-orange-600 pl-4 py-2">
          <p class="text-gray-800 dark:text-gray-200 text-sm leading-relaxed">${processedContent}</p>
          <p class="text-gray-600 dark:text-gray-400 text-sm mt-1">${sCn}</p>
        </div>
      `;
    }).join('');

    return `
      <div>
        <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
          <svg class="w-4 h-4 mr-2 text-orange-600 dark:text-orange-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
          </svg>
          例句
        </h3>
        <div class="space-y-3 bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
          ${sentencesHtml}
        </div>
      </div>
    `;
  }

  // 清理函数，关闭弹窗并清理历史记录
  disconnect() {
    if (this.wordDialog && this.wordDialog.open) {
      this.clearWordHistory();
      this.wordDialog.close();
    }
  }
}
