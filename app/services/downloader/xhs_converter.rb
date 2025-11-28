# 小红书内容数据转换器
#
# 负责从 HTML 页面中提取初始状态数据，并将其转换为可用的 Ruby 对象
# 处理 JavaScript 对象语法到有效 JSON 的转换，支持复杂的数据结构访问
class Downloader::XhsConverter
  # XPath 表达式，用于定位包含初始状态的 script 标签
  INITIAL_STATE_XPATH = "//script/text()"

  # 用于访问笔记数据的键路径，按优先级排序
  KEYS_LINK = [ "note", "noteDetailMap", "[-1]", "note" ].freeze

  # 处理输入内容并返回过滤后的数据
  #
  # 执行完整的数据提取、转换和过滤流程
  #
  # @param content [String] HTML 内容字符串
  # @return [Hash] 过滤后的笔记数据，如果解析失败返回空哈希
  # @example 处理 HTML 内容
  #   converter = Downloader::XhsConverter.new
  #   data = converter.run(html_content)
  def run(content)
    filter_object(convert_object(extract_object(content)))
  end

  # 从 HTML 中提取包含初始状态的脚本内容
  #
  # 解析 HTML 文档，查找包含 window.__INITIAL_STATE__ 的脚本标签
  #
  # @param html [String] HTML 内容字符串
  # @return [String] 提取的脚本内容，如果未找到返回空字符串
  # @note 使用 Nokogiri 解析 HTML，通过 XPath 定位脚本标签
  def extract_object(html)
    return "" if html.nil? || html.empty?

    doc = Nokogiri::HTML(html)
    scripts = doc.xpath(INITIAL_STATE_XPATH)
    get_script(scripts)
  end

  # 将 JavaScript 对象文本转换为 Ruby 对象
  #
  # 首先尝试使用 YAML 解析器安全加载，失败时回退到 JSON 解析
  # 支持清理 JavaScript 语法中不兼容 JSON 的部分
  #
  # @param text [String] 包含 JavaScript 对象的文本
  # @return [Hash, nil] 解析后的 Ruby 对象，解析失败返回 nil
  # @example 解析不同的数据格式
  #   convert_object('{"key": "value"}')  # => {"key" => "value"}
  # @note 优先使用 YAML 解析器，因为它更宽松且安全
  def convert_object(text)
    return {} unless text && !text.empty?

    # Remove window.__INITIAL_STATE__= prefix
    json_str = text.sub(/^window\.__INITIAL_STATE__\s*=\s*/, "").strip

    begin
      # Try YAML first (like Python's yaml.safe_load)
      Psych.safe_load(json_str)
    rescue Psych::SyntaxError, Psych::DisallowedClass
      # Fallback to JSON parsing
      begin
        # Clean up JavaScript syntax that's not valid JSON
        cleaned_str = normalize_js_object(json_str)
        JSON.parse(cleaned_str)
      rescue JSON::ParserError
        {}
      end
    end
  end

  # 从数据中提取指定的键路径值
  #
  # 使用预定义的键路径访问嵌套数据结构，支持数组索引
  #
  # @param data [Hash] 要搜索的数据哈希
  # @return [Hash, nil] 找到的笔记数据，未找到时返回空哈希
  # @example 提取嵌套数据
  #   filter_object({"note" => {"title" => "测试"}})  # => {"title" => "测试"}
  def filter_object(data)
    deep_get(data, KEYS_LINK) || {}
  end

  # 深度访问嵌套数据结构
  #
  # 支持通过键路径访问多层嵌套的数据，包括数组索引
  # 处理异常情况并返回默认值
  #
  # @param data [Hash] 要访问的数据对象
  # @param keys [Array] 键路径数组，支持字符串和数组索引
  # @param default [Object] 访问失败时的默认返回值
  # @return [Object] 找到的值或默认值
  # @example 访问嵌套结构
  #   deep_get({"a" => {"b" => [1, 2, 3]}}, ["a", "b", "[-1]"])  # => 3
  # @note 支持类似 Python 的 [-1] 数组索引语法
  def deep_get(data, keys, default = nil)
    return default unless data.is_a?(Hash)

    begin
      keys.reduce(data) do |obj, key|
        if key.start_with?("[") && key.end_with?("]")
          # Handle array indexing like Python's [-1]
          index = key[1..-2].to_i
          safe_get(obj, index)
        else
          obj[key]
        end
      end
    rescue KeyError, IndexError, TypeError
      default
    end
  end

  # 安全地访问数组或哈希的指定索引
  #
  # 处理不同数据类型的索引访问，提供统一的访问接口
  #
  # @param data [Hash, Array, Enumerable] 要访问的数据对象
  # @param index [Integer] 索引值
  # @return [Object, nil] 找到的值，访问失败返回 nil
  # @raise [TypeError] 当数据类型不支持索引访问时抛出异常
  # @example 不同数据类型的访问
  #   safe_get([1, 2, 3], 1)      # => 2
  #   safe_get({"a" => 1, "b" => 2}, 0) # => 1
  def safe_get(data, index)
    case data
    when Hash
      # Get values array and access by index
      values = data.values
      values[index] if index < values.length
    when Array, Enumerable
      data[index]
    else
      raise TypeError, "Expected Hash, Array or Enumerable, got #{data.class}"
    end
  end

  # 从脚本标签列表中获取包含初始状态的脚本
  #
  # 按逆序处理脚本标签，寻找包含特定前缀的内容
  # 模拟 Python 实现的处理逻辑
  #
  # @param scripts [Nokogiri::XML::NodeSet] 脚本标签节点集合
  # @return [String] 找到的初始状态内容，未找到返回空字符串
  # @note 逆序处理确保找到最后一个包含初始状态的脚本
  def get_script(scripts)
    # Process scripts in reverse, like Python implementation
    scripts.reverse_each do |script|
      content = script.to_s.strip
      return content if content.start_with?("window.__INITIAL_STATE__")
    end
    ""
  end

  private

  # 将 JavaScript 对象语法规范化为有效的 JSON
  #
  # 清理 JavaScript 中不被 JSON 支持的语法特性
  # 当前实现处理尾随逗号等常见问题
  #
  # @param js_str [String] JavaScript 对象字符串
  # @return [String] 规范化后的 JSON 字符串
  # @note 这是一个简化实现，生产环境可能需要更复杂的解析
  # @example 清理尾随逗号
  #   normalize_js_object('{"a": 1, "b": 2,}')  # => '{"a": 1, "b": 2}'
  def normalize_js_object(js_str)
    # Remove trailing commas before closing braces/brackets
    result = js_str.gsub(/,\s*([}\]])/m, '\1')

    # Handle single/double quoted strings that might not be valid in JSON
    # This is a simplified approach - more complex parsing may be needed for production
    result
  end
end
