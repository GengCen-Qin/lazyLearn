module ApplicationHelper
  # 处理定义文本中的英文单词，使其可点击
  def process_definition_with_clickable_words(text)
    return "" if text.blank?

    # 先按分号分割成多个定义
    definitions = text.split(";")

    # 处理每个定义
    definitions.map do |definition|
      # 对每个定义内部的文本进行分词处理
      processed_text = tokenize_text(definition).map do |token|
        if token[:type] == "word" && token[:value].length >= 2
          # 创建可点击的单词，添加 word-lookup-popup 类和 data-word 属性
          # 注意：不使用 data-action，改用事件委托
          content_tag :span, token[:value],
            class: "word-lookup-popup inline-block px-0.5 rounded hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900 dark:hover:text-blue-300 cursor-pointer transition-colors duration-150",
            data: { word: token[:value] }
        else
          # 其他内容直接转义显示
          h(token[:value])
        end
      end.join.html_safe

      # 包装成带项目符号的 div
      content_tag(:div, "• #{processed_text}".html_safe, class: "mb-1")
    end.join.html_safe
  end

  # 处理定义文本（中文等不需要处理英文单词）
  def process_definition_simple(text)
    return "" if text.blank?

    h(text).split(";").map { |defn| content_tag(:div, "• #{defn.strip}".html_safe, class: "mb-1") }.join.html_safe
  end

  private

  # 文本分词器 - 从 JS 移植到 Ruby
  def tokenize_text(text)
    tokens = []
    # 正则表达式匹配：英文单词 | 中文字符 | 数字 | 标点符号 | 空白字符
    regex = /([a-zA-Z]+)|([\u4e00-\u9fff]+)|(\d+)|([^\w\s\u4e00-\u9fff])|(\s+)/

    text.scan(regex).each do |match|
      english_word, chinese_chars, numbers, punctuation, whitespace = match

      if english_word
        tokens << { type: "word", value: english_word }
      elsif chinese_chars
        tokens << { type: "chinese", value: chinese_chars }
      elsif numbers
        tokens << { type: "number", value: numbers }
      elsif punctuation
        tokens << { type: "punctuation", value: punctuation }
      elsif whitespace
        tokens << { type: "whitespace", value: whitespace }
      end
    end

    tokens
  end
end
