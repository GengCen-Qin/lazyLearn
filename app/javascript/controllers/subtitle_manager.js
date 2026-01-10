/**
 * 字幕管理功能
 * 负责字幕列表渲染、同步播放和跳转功能
 */
export class SubtitleManager {
  constructor() {
    this.isAutoScrolling = false;
    this.lastScrollTime = 0;
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
    // 移除旧的事件监听器，避免重复绑定
    document.querySelectorAll(".word-lookup-popup").forEach((element) => {
      element.replaceWith(element.cloneNode(true));
    });

    // 重新获取所有单词元素并添加事件监听器
    const wordElements = document.querySelectorAll(".word-lookup-popup");
    wordElements.forEach((element, index) => {
      element.addEventListener("click", (e) => {
        e.stopPropagation(); // 阻止事件冒泡
        e.stopImmediatePropagation(); // 阻止其他事件执行
        // 调用主控制器的lookupWord方法
        if (handler && typeof handler.lookupWord === 'function') {
          handler.lookupWord(element.dataset.word);
        }
      });
    });
  }
}
