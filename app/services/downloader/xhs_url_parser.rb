class Downloader::XhsUrlParser
  def initialize(debug: false)
    @debug = debug
    @converter = Downloader::XhsConverter.new
    @explore = Downloader::XhsExplore.new
    @user_agent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    @timeout = 15
  end

  def parse_url(url)
    validate_url(url)
    final_url = resolve_short_link(url)
    html = fetch_html(final_url)
    data = extract_data_from_html(html)
    display_result(final_url, data)
    data
  rescue => e
    puts "❌ 解析失败: #{e.message}" if @debug
    nil
  end

  private

  def validate_url(url)
    patterns = [
      /xiaohongshu\.com\/explore\//,
      /xiaohongshu\.com\/discovery\/item\//,
      /xiaohongshu\.com\/user\/profile\//,
      /xhslink\.com\//
    ]
    raise ArgumentError, "无效的小红书链接格式" unless patterns.any? { |p| url.match(p) }
  end

  def resolve_short_link(url)
    return url unless url.include?("xhslink.com")

    puts "🔗 解析短链接: #{url}" if @debug

    response = Typhoeus.get(url, {
      timeout: @timeout,
      headers: { "User-Agent" => @user_agent },
      followlocation: true
    })

    if response.success?
      final_url = response.effective_url
      puts "🔗 重定向到: #{final_url}" if @debug
      final_url
    else
      puts "⚠️ 短链接解析失败: #{response.code}" if @debug
      url
    end
  end

  def fetch_html(url)
    puts "📥 获取页面: #{url}" if @debug

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

  def extract_data_from_html(html)
    puts "📄 HTML大小: #{html.length} 字符" if @debug

    if html.empty?
      raise "页面内容为空"
    end

    # Extract the initial state object using converter logic
    raw_data = @converter.extract_object(html)
    return {} if raw_data.empty?

    # Parse the data using the converter
    parsed_data = @converter.run(html)
    return {} unless parsed_data && !parsed_data.empty?

    # Process the data using explore logic
    @explore.run(parsed_data)
  end

  def display_result(url, data)
    puts "\n" + "="*50
    puts "📋 小红书解析结果"
    puts "="*50

    if data && !data.empty?
      puts "\n📝 作品信息:"
      puts "  ID: #{data['作品ID'] || '未知'}"
      puts "  标题: #{data['作品标题'] || '无标题'}"
      puts "  类型: #{data['作品类型'] || '未知'}"
      puts "  描述: #{(data['作品描述'] || '无')[0, 80]}#{'...' if (data['作品描述'] || '').length > 80}"
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

  def format_duration(seconds)
    return "未知" unless seconds.is_a?(Integer) || seconds.is_a?(Float)
    minutes = (seconds / 60).to_i
    secs = (seconds % 60).to_i
    "#{minutes}:#{secs.to_s.rjust(2, '0')}"
  end
end
