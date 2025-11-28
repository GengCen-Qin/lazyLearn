# 小红书 URL 解析器
#
# 负责解析小红书链接，获取页面内容并提取结构化数据
# 支持短链接解析、重定向处理和多种链接格式
class Downloader::XhsUrlParser
  # 初始化解析器
  #
  # 设置调试模式、转换器、探索器、用户代理和超时时间
  #
  # @param debug [Boolean] 是否启用调试模式，默认为 false
  # @example 创建解析器实例
  #   parser = Downloader::XhsUrlParser.new(debug: true)
  def initialize(debug: false)
    @debug = debug
    @converter = Downloader::XhsConverter.new
    @explore = Downloader::XhsExplore.new
    @user_agent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    @timeout = 15
  end

  # 解析小红书链接并提取内容信息
  #
  # 执行完整的链接解析流程：验证链接、解析重定向、获取页面、提取数据
  #
  # @param url [String] 要解析的小红书链接
  # @return [Hash, nil] 解析后的内容数据，解析失败返回 nil
  # @raise [ArgumentError] 当链接格式无效时抛出异常
  # @example 解析链接
  #   parser = Downloader::XhsUrlParser.new
  #   result = parser.parse_url("https://www.xiaohongshu.com/explore/abc123")
  def parse_url(url)
    validate_url(url)
    final_url = resolve_short_link(url)
    html = fetch_html(final_url)
    data = extract_data_from_html(html)
    display_result(final_url, data)
    data
  rescue => e
    # 调试模式下的错误输出已移除，生产环境静默处理
    nil
  end

  private

  # 验证链接格式
  #
  # 检查链接是否符合小红书的 URL 格式要求
  # 支持多种 URL 格式：探索页、发现页、用户主页、短链接等
  #
  # @param url [String] 要验证的链接
  # @raise [ArgumentError] 当链接格式无效时抛出异常
  # @note 支持的小红书域名格式
  def validate_url(url)
    patterns = [
      /xiaohongshu\.com\/explore\//,
      /xiaohongshu\.com\/discovery\/item\//,
      /xiaohongshu\.com\/user\/profile\//,
      /xhslink\.com\//
    ]
    raise ArgumentError, "无效的小红书链接格式" unless patterns.any? { |p| url.match(p) }
  end

  # 解析短链接
  #
  # 处理 xhslink.com 域名下的短链接，获取最终的重定向目标
  #
  # @param url [String] 可能是短链接的 URL
  # @return [String] 解析后的最终 URL，如果不是短链接则返回原 URL
  # @note 使用 HTTP HEAD 请求获取重定向信息
  def resolve_short_link(url)
    return url unless url.include?("xhslink.com")

    response = Typhoeus.get(url, {
      timeout: @timeout,
      headers: { "User-Agent" => @user_agent },
      followlocation: true
    })

    if response.success?
      final_url = response.effective_url
      final_url
    else
      url
    end
  end

  # 获取页面 HTML 内容
  #
  # 发送 HTTP GET 请求获取页面的完整 HTML 内容
  # 设置完整的浏览器请求头以避免被反爬虫机制拦截
  #
  # @param url [String] 要请求的页面 URL
  # @return [String] 页面的 HTML 内容
  # @raise [StandardError] 当 HTTP 请求失败时抛出异常
  # @note 使用真实的浏览器 User-Agent 和请求头
  def fetch_html(url)
    response = Typhoeus.get(url, {
      timeout: @timeout,
      headers: {
        "User-Agent" => @user_agent,
        "Accept" => "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language" => "zh-CN,zh;q=0.9,en;q=0.8",
        "Referer" => "https://www.xiaohongshu.com/",
        "Connection" => "keep-alive",
        "Upgrade-Insecure-Requests" => "1"
      },
      ssl_verifypeer: :none,
      followlocation: true
    })

    unless response.success?
      raise "HTTP请求失败: #{response.code} #{response.status_message}"
    end

    response.body
  end

  # 从 HTML 中提取数据
  #
  # 协调转换器和探索器从 HTML 中提取并处理内容数据
  #
  # @param html [String] 页面的 HTML 内容
  # @return [Hash] 提取并处理后的内容数据
  # @raise [StandardError] 当页面内容为空或解析失败时抛出异常
  def extract_data_from_html(html)
    if html.empty?
      raise "页面内容为空"
    end

    # Extract initial state object using converter logic
    raw_data = @converter.extract_object(html)
    return {} if raw_data.empty?

    # Parse data using converter
    parsed_data = @converter.run(html)
    return {} unless parsed_data && !parsed_data.empty?

    # Process data using explore logic
    @explore.run(parsed_data)
  end

  # 显示解析结果
  #
  # 格式化输出解析结果，包括作品信息、作者信息、互动数据等
  # 在调试模式下显示详细信息
  #
  # @param url [String] 解析的原始 URL
  # @param data [Hash] 提取的内容数据
  # @return [void] 输出结果到控制台
  def display_result(url, data)
    return unless @debug  # 只在调试模式下显示结果

    puts "\n" + "="*50
    puts "📋 小红书解析结果"
    puts "="*50

    if data && !data.empty?
      puts "\n📝 作品信息:"
      puts "  ID: #{data['作品ID'] || '未知'}"
      puts "  标题: #{data['作品标题'] || '无标题'}"
      puts "  类型: #{data['作品类型'] || '未知'}"
      puts "  描述: #{(data['作品描述'] || '')[0, 80]}#{'...' if (data['作品描述'] || '').length > 80}"
      puts "  发布时间: #{data['发布时间'] || '未知'}"
      puts "  作品链接: #{data['作品链接'] || '无'}"

      puts "\n👤 作者信息:"
      puts "  昵称: #{data['作者昵称'] || '未知'}"
      puts "  作者ID: #{data['作者ID'] || '未知'}"
      puts "  作者链接: #{data['作者链接'] || '无'}"

      puts "\n🏷️  标签信息:"
      puts "  标签: #{data['作品标签'] || '无'}"

      puts "\n📁 媒体信息:"
      if data["作品类型"] == "视频"
        puts "  类型: 视频"
        puts "  视频链接: #{data['视频链接'] || '未找到'}"
        puts "  视频时长: #{data['视频时长'] ? format_duration(data['视频时长']) : '未知'}"
      else
        puts "  类型: 图文/图集"
        puts "  图片数量: #{data['图片数量'] || 0}"
        if data["图片链接"] && data["图片链接"].length > 0
          puts "  首张图片: #{data['图片链接'].first}"
        end
      end

      puts "\n📊 互动数据:"
      puts "  👍 点赞: #{data['点赞数量'] || '0'}"
      puts "  ⭐ 收藏: #{data['收藏数量'] || '0'}"
      puts "  💬 评论: #{data['评论数量'] || '0'}"
      puts "  📤 分享: #{data['分享数量'] || '0'}"
    else
      puts "  ❌ 未提取到数据"
    end

    puts "\n🔗 原始链接: #{url}"
    puts "="*50
  end

  # 格式化时长显示
  #
  # 将秒数转换为分:秒格式的时长字符串
  #
  # @param seconds [Integer, Float] 时长秒数
  # @return [String] 格式化后的时长字符串，格式为 "分:秒"
  # @example 格式化时长
  #   format_duration(125)  # => "2:05"
  #   format_duration(65)   # => "1:05"
  def format_duration(seconds)
    return "未知" unless seconds.is_a?(Integer) || seconds.is_a?(Float)
    minutes = (seconds / 60).to_i
    secs = (seconds % 60).to_i
    "#{minutes}:#{secs.to_s.rjust(2, '0')}"
  end
end
