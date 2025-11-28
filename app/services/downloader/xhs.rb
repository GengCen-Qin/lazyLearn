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
    Downloader::XhsUrlParser.new.parse_url(url)
  end
end
