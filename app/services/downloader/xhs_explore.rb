class Downloader::XhsExplore
  def run(data)
    extract_data(data)
  end

  private

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

  def extract_interact_info(container, data)
    container['收藏数量'] = data.dig('interactInfo', 'collectedCount') || '-1'
    container['评论数量'] = data.dig('interactInfo', 'commentCount') || '-1'
    container['分享数量'] = data.dig('interactInfo', 'shareCount') || '-1'
    container['点赞数量'] = data.dig('interactInfo', 'likedCount') || '-1'
  end

  def extract_tags(container, data)
    tags = data['tagList'] || []
    container['作品标签'] = tags.map { |tag| tag['name'] }.compact.join(' ')
  end

  def extract_info(container, data)
    container['作品ID'] = data['noteId']
    container['作品链接'] = "https://www.xiaohongshu.com/explore/#{container['作品ID']}" if container['作品ID']
    container['作品标题'] = data['title']
    container['作品描述'] = data['desc']
    container['作品类型'] = classify_works(data)
  end

  def extract_time(container, data)
    time = data['time']
    if time
      time_value = time.to_s.length > 10 ? time / 1000.0 : time
      container['发布时间'] = Time.at(time_value).strftime('%Y-%m-%d %H:%M:%S')
      container['时间戳'] = time_value
    else
      container['发布时间'] = '未知'
      container['时间戳'] = nil
    end

    last = data['lastUpdateTime']
    if last
      last_value = last.to_s.length > 10 ? last / 1000.0 : last
      container['最后更新时间'] = Time.at(last_value).strftime('%Y-%m-%d %H:%M:%S')
    else
      container['最后更新时间'] = '未知'
    end
  end

  def extract_user(container, data)
    user = data['user'] || {}
    container['作者昵称'] = user['nickname']
    container['作者ID'] = user['userId']
    container['作者链接'] = "https://www.xiaohongshu.com/user/profile/#{container['作者ID']}" if container['作者ID']
  end

  def extract_media_info(container, data)
    type = data['type']

    case type
    when 'video'
      # Extract video information based on Python implementation logic
      video_info = data['video'] || {}
      consumer_info = video_info['consumer'] || {}
      origin_video_key = consumer_info['originVideoKey']

      if origin_video_key
        video_url = "https://sns-video-bd.xhscdn.com/#{origin_video_key}"
        container['视频链接'] = video_url
        container['视频时长'] = consumer_info['duration'] if consumer_info['duration']
      else
        container['视频链接'] = nil
      end
    when 'normal'
      # For normal (image) posts, collect image links
      image_list = data['imageList'] || []
      if image_list.length > 0
        image_urls = image_list.map { |img| img['url'] if img['url'] }.compact
        container['图片链接'] = image_urls
        container['图片数量'] = image_urls.length
      else
        container['图片链接'] = []
        container['图片数量'] = 0
      end
    else
      container['视频链接'] = nil
      container['图片链接'] = []
    end
  end

  def classify_works(data)
    type = data['type']
    list = data['imageList'] || []
    if !['video', 'normal'].include?(type) || list.length == 0
      '未知'
    elsif type == 'video'
      list.length == 1 ? '视频' : '图集'  # A video with multiple images is an "album" in practice
    else
      '图文'
    end
  end
end