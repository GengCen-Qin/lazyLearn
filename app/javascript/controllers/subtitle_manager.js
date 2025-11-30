/**
 * 字幕管理功能
 * 负责字幕列表渲染、同步播放和跳转功能
 */
export class SubtitleManager {
  constructor() {
    this.isAutoScrolling = false;
    this.lastScrollTime = 0;
  }

  // 渲染字幕列表到UI
  renderSubtitleList(subtitlesValue, subtitleListTarget, formatTime, processSubtitleText, seekToSubtitle, escapeHtml, handler) {
    if (!subtitleListTarget) return;
    const container = subtitleListTarget;

    // 无字幕时显示提示信息
    if (subtitlesValue.length === 0) {
      container.innerHTML = '<div class="no-subtitles text-center text-gray-500 p-6 text-sm">请上传字幕文件</div>';
      return;
    }

    // 清空容器
    container.innerHTML = "";

    // 为每条字幕创建UI元素
    subtitlesValue.forEach((subtitle, index) => {
      const item = document.createElement("div");
      item.className = "subtitle-item p-2 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors duration-150";
      item.dataset.index = index;
      item.dataset.start = subtitle.start;

      const time = formatTime(subtitle.start);

      // 将字幕文本中的英文单词可点击
      const processedText = processSubtitleText(subtitle.text, escapeHtml);

      item.innerHTML = `
        <div class="text-xs text-gray-500 mb-1">${time}</div>
        <div class="text-sm text-gray-800">${processedText}</div>
      `;

      // 设置字幕行点击事件（用于时间跳转）
      item.addEventListener("click", (e) => {
        // 如果点击的是单词，不触发时间跳转（避免冲突）
        if (e.target.classList.contains("word-lookup")) {
          e.stopPropagation();
          return;
        }
        seekToSubtitle(index);
      });

      container.appendChild(item);
    });

    // 添加单词点击事件监听
    this.addWordClickListeners(handler);
  }

  // 同步字幕到当前播放时间
  syncSubtitles(currentTime, subtitlesValue, currentIndexValue, setCurrentIndex) {
    const newSubtitleIndex = this.findCurrentSubtitleIndex(currentTime, subtitlesValue);

    // 如果字幕索引发生变化，更新相关UI
    if (newSubtitleIndex !== currentIndexValue) {
      setCurrentIndex(newSubtitleIndex);
    }
  }

  // 手动设置当前字幕索引
  setCurrentSubtitle(index, setCurrentIndex) {
    setCurrentIndex(index);
  }

  // 根据当前播放时间查找应该显示的字幕索引
  findCurrentSubtitleIndex(currentTime, subtitlesValue) {
    for (let i = subtitlesValue.length - 1; i >= 0; i--) {
      if (currentTime >= subtitlesValue[i].start) {
        return i;
      }
    }
    return -1; // 没有匹配的字幕
  }

  // 更新当前字幕的激活状态
  updateActiveSubtitle(currentIndexValue) {
    // 移除所有字幕项的激活状态
    document.querySelectorAll(".subtitle-item").forEach((item) => {
      item.classList.remove("active");
    });

    // 为当前字幕添加激活状态
    if (currentIndexValue >= 0) {
      const currentElement = document.querySelector(
        `[data-index="${currentIndexValue}"]`,
      );
      if (currentElement) {
        currentElement.classList.add("active");
      }
    }
  }

  // 滚动到当前激活的字幕位置
  scrollToCurrentSubtitle() {
    const activeElement = document.querySelector(".subtitle-item.active");
    if (activeElement && !this.isAutoScrolling) {
      const now = Date.now();
      if (now - this.lastScrollTime < 100) return; // 防止频繁滚动

      this.isAutoScrolling = true;
      this.lastScrollTime = now;

      // 平滑滚动到当前字幕，使其居中显示
      activeElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      // 500ms后重置滚动状态
      setTimeout(() => {
        this.isAutoScrolling = false;
      }, 500);
    }
  }

  // 跳转到上一条字幕
  jumpToPrevious(subtitlesValue, currentIndexValue, seekToSubtitle) {
    if (subtitlesValue.length === 0) return;

    let targetIndex;
    if (currentIndexValue <= 0) {
      targetIndex = 0; // 不超出第一条
    } else {
      targetIndex = currentIndexValue - 1;
    }
    seekToSubtitle(targetIndex);
  }

  // 跳转到下一条字幕
  jumpToNext(subtitlesValue, currentIndexValue, seekToSubtitle) {
    if (subtitlesValue.length === 0) return;

    let targetIndex;
    if (
      currentIndexValue < 0 ||
      currentIndexValue >= subtitlesValue.length - 1
    ) {
      targetIndex = subtitlesValue.length - 1; // 不超出最后一条
    } else {
      targetIndex = currentIndexValue + 1;
    }
    seekToSubtitle(targetIndex);
  }

  // 更新字幕总数
  updateSubtitleCount(subtitlesValue, subtitleCountTarget) {
    if (subtitleCountTarget) {
      subtitleCountTarget.textContent = `${subtitlesValue.length} 条字幕`;
    }
  }

  // 添加单词点击事件监听器
  addWordClickListeners(handler) {
    console.log('SubtitleManager: addWordClickListeners called with handler', handler);
    // 移除旧的事件监听器，避免重复绑定
    document.querySelectorAll(".word-lookup").forEach((element) => {
      element.replaceWith(element.cloneNode(true));
    });

    // 重新获取所有单词元素并添加事件监听器
    const wordElements = document.querySelectorAll(".word-lookup");
    console.log('SubtitleManager: Found', wordElements.length, 'word elements');
    wordElements.forEach((element, index) => {
      const word = element.dataset.word;
      console.log('SubtitleManager: Adding click listener to word', word);
      element.addEventListener("click", (e) => {
        e.stopPropagation(); // 阻止事件冒泡
        console.log('SubtitleManager: Word clicked:', word, 'Handler available:', handler && typeof handler.lookupWord === 'function');
        // 调用主控制器的lookupWord方法
        if (handler && typeof handler.lookupWord === 'function') {
          handler.lookupWord(word, e.target);
        }
      });
    });
  }
}