# 文本渲染助手
# 统一的文本处理模块，提供可点击单词功能
module TextRenderHelper
  # 渲染可点击单词的文本
  # @param text [String] 要处理的文本
  # @param options [Hash] 配置选项
  # @option options [Integer] :min_word_length 英文单词最小长度 (默认: 2)
  # @option options [String] :join 标签
  # @option options [String] :split 分割符
  def render_text_with_clickable_words(text, options = {})
    return "" if text.blank?

    # 默认配置
    options = {
      min_word_length: 2,
      join: "",
      split: ";"
    }.merge(options)
    processed_texts = text.split(options[:split]).map { |definition| process_single_text(definition.strip, options) }
    processed_texts.map { |processed| content_tag(:div, "#{options[:join]} #{processed}".html_safe, class: "mb-1") }.join.html_safe
  end

  # 处理单个文本片段（不包含分号分割逻辑）
  # @param text [String] 要处理的文本
  # @param options [Hash] 配置选项
  def process_single_text(text, options)
    tokens = tokenize_text(text)
    tokens.map do |token|
      case token[:type]
      when :word
        if token[:value].length >= options[:min_word_length]
          content_tag(:span,
            content_tag(:span, token[:value]),
            class: "word-lookup-popup inline-block px-0.5 rounded hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900 dark:hover:text-blue-300 cursor-pointer transition-colors duration-150",
            data: { word: token[:value] }
          )
        else
          token[:value]
        end
      else
        # 中文、数字、标点、空格直接显示
        token[:value]
      end
    end.join.html_safe
  end

  # 统一的文本分词器
  # 与JavaScript Utils.js中的tokenizeText保持一致
  # @param text [String] 要分词的文本
  # @return [Array<Hash>] 分词结果数组
  def tokenize_text(text)
    tokens = []

    # 使用与JavaScript完全相同的正则表达式
    # Ruby的/u标志表示Unicode模式，确保中文匹配正确
    regex = /([a-zA-Z]+)|([\u4e00-\u9fff]+)|(\d+)|([^\w\s\u4e00-\u9fff])|(\s+)/u

    position = 0
    while position < text.length
      match = text.match(regex, position)
      break unless match

      full_match = match[0]
      english_word = match[1]
      chinese_chars = match[2]
      numbers = match[3]
      punctuation = match[4]
      whitespace = match[5]

      if english_word
        tokens << { type: :word, value: english_word }
      elsif chinese_chars
        tokens << { type: :chinese, value: chinese_chars }
      elsif numbers
        tokens << { type: :number, value: numbers }
      elsif punctuation
        tokens << { type: :punctuation, value: punctuation }
      elsif whitespace
        tokens << { type: :whitespace, value: whitespace }
      end

      position = match.end(0)
    end

    # 处理正则表达式未匹配的部分（理论上不应该发生，但安全起见）
    if position < text.length
      remaining = text[position..-1]
      tokens << { type: :text, value: remaining }
    end

    tokens
  end

  # 针对中文单词信息展示
  def process_definition_simple(text)
    return "" if text.blank?
    h(text).split(";").map { |defn| content_tag(:div, "• #{defn.strip}".html_safe, class: "mb-1") }.join.html_safe
  end
end
