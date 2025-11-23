# 用于下载小红书视频的服务类
class XiaohongshuVideoDownloader
  # Public method to download and save a video from a Xiaohongshu URL
  #
  # @param url [String] the Xiaohongshu video URL to download
  # @param title [String] the video title (optional)
  # @param description [String] the video description (optional)
  # @return [Hash] result hash containing success status and relevant data
  def self.download_and_save(url, title = nil, description = nil)
    new(url, title, description).download_and_save
  end

  # Public method to download a file from a URL
  #
  # @param url [String] the URL to download
  # @return [Hash] hash containing file information (io, filename, content_type)
  def self.download(url)
    new(url).download
  end

  def initialize(url, title = nil, description = nil)
    @url = url
    @title = title
    @description = description
    @video_file_info = nil
  end

  # Download and save the Xiaohongshu video to the database
  #
  # @return [Hash] result hash containing success status and relevant data
  def download_and_save
    # Validate the URL first
    unless valid_xiaohongshu_url?(@url)
      return {
        success: false,
        error: "无效的小红书链接",
        status: :bad_request
      }
    end

    # 检查是否已经存在相同下载链接的视频
    existing_video = Video.find_by(download_link: @url)
    if existing_video
      return {
        success: true,
        video_exists: true,
        video_id: existing_video.id,
        video_record: existing_video,
        message: "视频已存在，跳过下载"
      }
    end

    begin
      @video_file_info = download

      video = Video.create!(
        title: @title || "小红书视频 - #{Time.current.strftime('%Y-%m-%d %H:%M:%S')}",
        description: @description || "从小红书下载的视频: #{@url}",
        download_link: @url
      )

      # 附加文件
      video.video_file.attach(@video_file_info)

      # 手动触发转录，因为文件是在创建后附加的
      if video.persisted? && video.video_file.attached?
        video.trigger_transcription_async
        {
          success: true,
          video_id: video.id,
          file_path: video.local_path,
          file_name: video.video_file.blob.filename.to_s
        }
      else
        {
          success: false,
          error: "保存视频失败",
          status: :internal_server_error
        }
      end
    rescue => e
      {
        success: false,
        error: e.message,
        status: :internal_server_error
      }
    ensure
      close_file_io
    end
  end

  # Download the file from the URL
  #
  # @return [Hash] hash containing file information (io, filename, content_type)
  def download
    filename = generate_filename

    downloaded_file = Down.download(@url)

    Rails.logger.info("Downloaded file: #{filename}")

    {
      io: downloaded_file,
      filename: filename,
      content_type: determine_content_type(downloaded_file) || "video/mp4"
    }
  end

  private

  attr_reader :url, :title, :description, :video_file_info

  # Validate if the provided URL is a valid Xiaohongshu URL
  #
  # @param url [String] the URL to validate
  # @return [Boolean] true if the URL is valid, false otherwise
  def valid_xiaohongshu_url?(url)
    return false if url.blank?

    # Check if it's a valid HTTP/HTTPS URL
    uri = URI.parse(url)
    return false unless uri.is_a?(URI::HTTP)

    # Check if URL might point to a video file (based on extension or URL pattern)
    is_video_url?(url)
  rescue URI::InvalidURIError
    false
  end

  # Check if the URL is likely to point to a video
  #
  # @param url [String] the URL to check
  # @return [Boolean] true if the URL appears to be a video URL, false otherwise
  def is_video_url?(url)
    # Check if URL contains common video file extensions
    video_extensions = %w[.mp4 .mov .avi .mkv .wmv .flv .webm .m4v .mpg .mpeg .3gp .3g2 .mxf]
    extension = File.extname(url).downcase
    return true if video_extensions.include?(extension)

    # Specific pattern for Xiaohongshu video URLs
    # Example: https://sns-video-bd.xhscdn.com/spectrum/1040g0jg31ouqmoj31u005ociercocgeo8t10tbo
    # Xiaohongshu video URLs might not have file extensions, but we can identify them by other means
    url.include?("sns-video") || url.include?("spectrum")
  end

  # Generate a filename for the downloaded file
  #
  # @return [String] the generated filename
  def generate_filename
    # Extract filename from URL, default to .mp4 if URL has no extension
    basename = File.basename(URI.parse(url).path)
    if basename.include?(".")
      # If path already contains extension
      "xiaohongshu_#{basename}"
    else
      # If path has no extension, use default .mp4 extension
      "xiaohongshu_video_#{Time.current.to_i}.mp4"
    end
  end

  # Determine the content type of the downloaded file
  #
  # @param downloaded_file [Object] the downloaded file object
  # @return [String, nil] content type string or nil if not identified
  def determine_content_type(downloaded_file)
    # Since Down.download doesn't provide response headers directly,
    # we determine content type based on file extension or using third-party libraries
    ext = File.extname(downloaded_file.path).downcase
    case ext
    when ".mp4"
      "video/mp4"
    when ".mov"
      "video/quicktime"
    when ".avi"
      "video/x-msvideo"
    when ".mkv"
      "video/x-matroska"
    when ".webm"
      "video/webm"
    when ".m4v"
      "video/x-m4v"
    else
      nil
    end
  end

  # Close the file IO if it's open
  def close_file_io
    if @video_file_info && @video_file_info[:io] && !@video_file_info[:io].closed?
      @video_file_info[:io].close
    end
  end
end
