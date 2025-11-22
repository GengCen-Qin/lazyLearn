# 用于调用小红书详情API的服务类
class XiaohongshuApiService
  include HTTParty
  base_uri 'localhost:5556'

  def self.extract_content(share_text)
    new(share_text).extract_content
  end

  def initialize(share_text)
    @share_text = share_text
  end

  # 从分享文本中提取小红书内容
  #
  # @return [Hash] 包含成功状态和相关数据的hash
  def extract_content
    xiaohongshu_url = parse_share_text
    return error_result("无法解析小红书链接") unless xiaohongshu_url

    api_response = call_detail_api(xiaohongshu_url)
    return error_result("API调用失败") unless api_response.success?

    parse_api_response(api_response.parsed_response)
  end

  private

  attr_reader :share_text

  # 从分享文本中提取xhslink.com链接
  #
  # @return [String, nil] 提取到的小红书链接，如果找不到则返回nil
  def parse_share_text
    # 使用URI.extract提取所有URL
    urls = URI.extract(@share_text, ['http', 'https'])

    # 查找包含xhslink.com的URL
    xiaohongshu_urls = urls.select { |url| url.include?('xhslink.com') }

    # 返回第一个找到的小红书链接
    xiaohongshu_urls.first
  rescue => e
    Rails.logger.error "解析分享文本失败: #{e.message}"
    nil
  end

  # 调用小红书详情API
  #
  # @param url [String] 小红书链接
  # @return [HTTParty::Response] API响应
  def call_detail_api(url)
    self.class.post('/xhs/detail',
      body: api_params(url).to_json,
      headers: { 'Content-Type' => 'application/json' },
      timeout: 30
    )
  rescue => e
    Rails.logger.error "调用小红书API失败: #{e.message}"
    nil
  end

  # 构建API请求参数
  #
  # @param url [String] 小红书链接
  # @return [Hash] API请求参数
  def api_params(url)
    {
      url: url,
      download: false,
      index: ["string", 0],
      skip: false
    }
  end

  # 解析API响应数据
  #
  # @param response [Hash] API响应数据
  # @return [Hash] 解析后的结果
  def parse_api_response(response)
    return error_result("API响应格式错误") unless response.is_a?(Hash)

    data = response['data']
    return error_result("API响应中缺少数据") unless data.is_a?(Hash)

    # 提取所需字段
    title = data['作品标题']
    download_urls = data['下载地址']
    description = data['作品描述']

    return error_result("无法获取作品标题") unless title.present?
    return error_result("无法获取下载地址") unless download_urls.is_a?(Array) && download_urls.any?

    # 获取第一个下载地址
    download_url = download_urls.first
    return error_result("下载地址为空") unless download_url.present?

    success_result(title, download_url, description)
  end

  # 创建成功结果
  #
  # @param title [String] 视频标题
  # @param download_url [String] 下载地址
  # @param description [String] 视频描述
  # @return [Hash] 成功结果
  def success_result(title, download_url, description = nil)
    {
      success: true,
      title: title,
      download_url: download_url,
      description: description || "从小红书下载的视频"
    }
  end

  # 创建错误结果
  #
  # @param error_message [String] 错误信息
  # @return [Hash] 错误结果
  def error_result(error_message)
    {
      success: false,
      error: error_message
    }
  end
end