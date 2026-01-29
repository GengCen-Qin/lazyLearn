# 单词渲染助手
# 用于将文本中的英文单词转换为可点击的HTML元素
module WordRenderHelper
  # 将文本中的英文单词转换为可点击的HTML
  # 与app/javascript/controllers/utils.js中的processSubtitleText保持一致的逻辑
  def render_clickable_words(text)
    return "" if text.blank?

    tokens = tokenize_text(text)
    tokens.map do |token|
      case token[:type]
      when :word
        # 英文单词，长度>=2才可点击（与JavaScript逻辑一致）
        if token[:value].length >= 2
          # 创建可点击的单词元素
          content_tag(:span,
            content_tag(:span, token[:value]),
            class: "word-lookup-popup inline-block px-0.5 rounded hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900 dark:hover:text-blue-300 cursor-pointer transition-colors duration-150",
            data: { word: token[:value] }
          )
        else
          # 长度<2的单词直接显示
          token[:value]
        end
      else
        # 中文、数字、标点、空格直接显示
        token[:value]
      end
    end.join.html_safe
  end

  private

  # 分词文本，与JavaScript Utils.js中的tokenizeText保持一致的逻辑
  # 正则表达式：英文单词 | 中文字符 | 数字 | 标点符号 | 空白字符
  def tokenize_text(text)
    tokens = []

    # 使用与JavaScript完全相同的正则表达式
    # 注意：Ruby的/u标志表示Unicode模式，确保中文匹配正确
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
end
