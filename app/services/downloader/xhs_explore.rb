# 小红书内容数据探索器
#
# 负责从解析的数据中提取和组织各种类型的内容信息
# 包括作品信息、用户信息、互动数据和媒体信息等
class Downloader::XhsExplore
  # 处理数据并提取完整的内容信息
  #
  # 从原始数据中提取和组织所有相关信息，返回结构化的内容数据
  #
  # @param data [Hash] 从转换器获得的原始数据
  # @return [Hash] 结构化的内容数据，包含作品、用户、互动等信息
  # @example 处理笔记数据
  #   explorer = Downloader::XhsExplore.new
  #   content = explorer.run(note_data)
  def run(data)
    extract_data(data)
  end

  private

  # 从数据中提取所有相关信息
  #
  # 调用各个子方法提取不同类型的数据并组织成统一结构
  #
  # @param data [Hash] 原始数据哈希
  # @return [Hash] 提取并组织后的内容数据
  def extract_data(data)
    result = {}
    if data && !data.empty?
      extract_interact_info(result, data)
      extract_tags(result, data)
      extract_info(result, data)
      extract_time(result, data)
      extract_user(result, data)
      extract_media_info(result, data)  # Add media info extraction
    end
    result
  end

  # 提取互动信息
  #
  # 从数据中提取点赞、收藏、评论、分享等互动统计数据
  #
  # @param container [Hash] 用于存储提取结果的容器哈希
  # @param data [Hash] 包含互动信息的原始数据
  # @return [void] 直接修改 container 参数
  # @example 提取互动数据
  #   extract_interact_info(result, {"interactInfo" => {"likedCount" => 100}})
  def extract_interact_info(container, data)
    container["收藏数量"] = data.dig("interactInfo", "collectedCount") || "-1"
    container["评论数量"] = data.dig("interactInfo", "commentCount") || "-1"
    container["分享数量"] = data.dig("interactInfo", "shareCount") || "-1"
    container["点赞数量"] = data.dig("interactInfo", "likedCount") || "-1"
  end

  # 提取标签信息
  #
  # 从数据中提取作品标签并格式化为字符串
  #
  # @param container [Hash] 用于存储提取结果的容器哈希
  # @param data [Hash] 包含标签信息的原始数据
  # @return [void] 直接修改 container 参数
  # @example 提取标签
  #   extract_tags(result, {"tagList" => [{"name" => "美食"}, {"name" => "分享"}]})
  def extract_tags(container, data)
    tags = data["tagList"] || []
    container["作品标签"] = tags.map { |tag| tag["name"] }.compact.join(" ")
  end

  # 提取基本作品信息
  #
  # 提取作品 ID、标题、描述、类型等基本信息
  #
  # @param container [Hash] 用于存储提取结果的容器哈希
  # @param data [Hash] 包含作品信息的原始数据
  # @return [void] 直接修改 container 参数
  def extract_info(container, data)
    container["作品ID"] = data["noteId"]
    container["作品链接"] = "https://www.xiaohongshu.com/explore/#{container['作品ID']}" if container["作品ID"]
    container["作品标题"] = data["title"]
    container["作品描述"] = data["desc"]
    container["作品类型"] = classify_works(data)
  end

  # 提取时间信息
  #
  # 提取发布时间和最后更新时间，并格式化为可读格式
  #
  # @param container [Hash] 用于存储提取结果的容器哈希
  # @param data [Hash] 包含时间信息的原始数据
  # @return [void] 直接修改 container 参数
  # @note 处理毫秒时间戳和秒时间戳的转换
  def extract_time(container, data)
    time = data["time"]
    if time
      time_value = time.to_s.length > 10 ? time / 1000.0 : time
      container["发布时间"] = Time.at(time_value).strftime("%Y-%m-%d %H:%M:%S")
      container["时间戳"] = time_value
    else
      container["发布时间"] = "未知"
      container["时间戳"] = nil
    end

    last = data["lastUpdateTime"]
    if last
      last_value = last.to_s.length > 10 ? last / 1000.0 : last
      container["最后更新时间"] = Time.at(last_value).strftime("%Y-%m-%d %H:%M:%S")
    else
      container["最后更新时间"] = "未知"
    end
  end

  # 提取用户信息
  #
  # 从数据中提取作者的昵称、ID 和链接信息
  #
  # @param container [Hash] 用于存储提取结果的容器哈希
  # @param data [Hash] 包含用户信息的原始数据
  # @return [void] 直接修改 container 参数
  def extract_user(container, data)
    user = data["user"] || {}
    container["作者昵称"] = user["nickname"]
    container["作者ID"] = user["userId"]
    container["作者链接"] = "https://www.xiaohongshu.com/user/profile/#{container['作者ID']}" if container["作者ID"]
  end

  # 提取媒体信息
  #
  # 根据作品类型提取视频或图片信息
  # 支持视频链接、时长和图片链接、数量等信息
  #
  # @param container [Hash] 用于存储提取结果的容器哈希
  # @param data [Hash] 包含媒体信息的原始数据
  # @return [void] 直接修改 container 参数
  # @note 基于 Python 实现的逻辑提取视频和图片信息
  def extract_media_info(container, data)
    type = data["type"]

    case type
    when "video"
      # Extract video information based on Python implementation logic
      video_info = data["video"] || {}
      consumer_info = video_info["consumer"] || {}
      origin_video_key = consumer_info["originVideoKey"]

      if origin_video_key
        video_url = "https://sns-video-bd.xhscdn.com/#{origin_video_key}"
        container["视频链接"] = video_url
        container["视频时长"] = consumer_info["duration"] if consumer_info["duration"]
      else
        container["视频链接"] = nil
      end
    when "normal"
      # For normal (image) posts, collect image links
      image_list = data["imageList"] || []
      if image_list.length > 0
        image_urls = image_list.map { |img| img["url"] if img["url"] }.compact
        container["图片链接"] = image_urls
        container["图片数量"] = image_urls.length
      else
        container["图片链接"] = []
        container["图片数量"] = 0
      end
    else
      container["视频链接"] = nil
      container["图片链接"] = []
    end
  end

  # 分类作品类型
  #
  # 根据数据类型和图片数量确定作品的展示类型
  #
  # @param data [Hash] 包含类型和媒体信息的原始数据
  # @return [String] 作品类型（视频、图集、图文、未知）
  # @note 视频类型有多张图片时实际上显示为图集
  def classify_works(data)
    type = data["type"]
    list = data["imageList"] || []
    if ![ "video", "normal" ].include?(type) || list.length == 0
      "未知"
    elsif type == "video"
      list.length == 1 ? "视频" : "图集"  # A video with multiple images is an "album" in practice
    else
      "图文"
    end
  end
end
