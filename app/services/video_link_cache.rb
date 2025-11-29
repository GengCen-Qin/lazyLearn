# 视频链接缓存服务类
class VideoLinkCache
  # 缓存过期时间
  CACHE_EXPIRY = 3.days

  # 根据分享文本查找已缓存的视频
  #
  # @param share_text [String] 分享文本
  # @return [Video, nil] 找到的视频记录，未找到返回nil
  def self.find_video(share_text)
    return nil unless share_text.present?

    cache_key = generate_cache_key(share_text)
    video_id = Rails.cache.read(cache_key)

    return nil unless video_id

    # 确保视频仍然存在
    Video.find_by(id: video_id)
  end

  # 缓存视频记录
  #
  # @param share_text [String] 分享文本
  # @param video [Video] 视频记录
  def self.cache_video(share_text, video)
    return unless share_text.present? && video.present?

    cache_key = generate_cache_key(share_text)
    Rails.cache.write(cache_key, video.id, expires_in: CACHE_EXPIRY)
  end

  private

  # 生成缓存键
  #
  # @param share_text [String] 分享文本
  # @return [String] 缓存键
  def self.generate_cache_key(share_text)
    # 使用MD5哈希确保键的唯一性和合适的长度
    hash = Digest::MD5.hexdigest(share_text)
    "video_link_#{hash}"
  end
end
