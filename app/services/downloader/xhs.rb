# 小红书内容下载器主类
#
# 提供小红书内容的统一入口接口，协调各个子模块完成内容解析功能
#
# @example 解析小红书链接
#   downloader = Downloader::Xhs.new
#   result = downloader.parse("https://www.xiaohongshu.com/explore/abc123")
class Downloader::Xhs
  # 解析小红书链接并提取内容信息
  #
  # 创建新的 URL 解析器实例并委托给解析器处理
  #
  # @param url [String] 要解析的小红书链接
  # @return [Hash] 解析后的内容数据，包含作品信息、作者信息、互动数据等
  # @raise [ArgumentError] 当链接格式无效时抛出异常
  # @example 基本用法
  #   parser = Downloader::Xhs.new
  #   result = parser.parse("https://www.xiaohongshu.com/explore/abc123")
  # @note 内部使用 Downloader::XhsUrlParser 进行实际解析工作
  def parse(url)
    result = Downloader::XhsUrlParser.new.parse_url(link(url))
    return { success: false } if result.nil?

    {
      success: true,
      filename: result["作品标题"],
      ori_url: link(url),
      ori_video_url: result["视频链接"],
      description: result["作品描述"],
    }
  end

  private

  # 从分享文本中提取xhslink.com链接
  #
  # @return [String, nil] 提取到的小红书链接，如果找不到则返回nil
  def link(text)
    urls = URI.extract(text, [ "http", "https" ])

    targets = urls.select { |url| [ "xhslink.com", "xiaohongshu.com", "xiaohongshu" ].any? { |domain| url.include?(domain) } }

    raise ArgumentError, "找不到小红书链接" if targets.empty?

    targets.first
  rescue => e
    Rails.logger.error "解析分享文本失败: #{e.message} #{text}"
    nil
  end
end
