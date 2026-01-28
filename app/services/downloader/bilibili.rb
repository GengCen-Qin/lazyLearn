# Bilibili内容下载器主类
#
# 提供Bilibili内容的统一入口接口，协调各个子模块完成内容解析功能
#
# @example 解析Bilibili链接
#   downloader = Downloader::Bilibili.new
#   result = downloader.parse("https://www.bilibili.com/video/BV1G4zLBtEAn")
class Downloader::Bilibili
  class NotSupportException < Exception
  end

  # 解析Bilibili链接并提取内容信息
  #
  # 创建新的 URL 解析器实例并委托给解析器处理
  #
  # @param url [String] 要解析的Bilibili链接
  # @return [Hash] 解析后的内容数据，包含视频信息、标题等
  # @raise [ArgumentError] 当链接格式无效时抛出异常
  # @example 基本用法
  #   parser = Downloader::Bilibili.new
  #   result = parser.parse("https://www.bilibili.com/video/BV1G4zLBtEAn")
  def parse(url)
    # Validate URL format
    unless valid_bilibili_url?(url)
      raise NotSupportException.new("不支持的Bilibili链接格式")
    end

    # Use the provided bilibili_audio_fetcher.rb logic to get audio info
    require_relative '../../../bilibili_audio_fetcher'

    fetcher = BilibiliAudioFetcher.new
    audio_info = fetcher.fetch_audio(url)

    raise NotSupportException.new("无法获取Bilibili音频信息") if audio_info.nil?

    # Extract audio URL from audio info
    audio_url = extract_audio_url(audio_info)
    raise NotSupportException.new("未找到音频流") if audio_url.blank?

    {
      success: true,
      filename: sanitize_filename(audio_info[:title]),
      ori_url: url,
      audio_url: audio_url,
      description: audio_info[:title]
    }
  end

  private

  def valid_bilibili_url?(url)
    url.match?(/https?:\/\/(www\.)?bilibili\.com\/video\/((av(\d+))|(bv(\S+))|(BV(\S+)))/i)
  end

  def extract_audio_url(audio_info)
    # Look for audio streams in the audio info
    if audio_info[:audio_streams].present?
      # Get the first available audio stream (usually highest quality)
      first_audio_stream = audio_info[:audio_streams].first
      if first_audio_stream
        return first_audio_stream[1][:base_url] # Return the base URL of the first audio stream
      end
    end

    nil
  end

  def sanitize_filename(filename)
    # Remove or replace invalid characters for filenames
    filename.gsub(/[\/\\:*?"<>|]/, '_').gsub(/\s+/, ' ').strip
  end
end
