class WelcomeController < ApplicationController
  def index
  end

  def download_xiaohongshu
    share_text = params[:url]

    unless share_text.present?
      render json: { success: false, error: "分享内容不能为空" }, status: :bad_request
      return
    end

    cached_video = VideoLinkCache.find_video(share_text)
    if cached_video
      render json: {
        success: true,
        redirect_to: "/videos/#{cached_video.id}",
        message: "视频已存在，正在跳转到视频详情页...",
        video_exists: true
      }
      return
    end

    # 首先尝试从API获取内容信息
    api_result = XiaohongshuApiService.extract_content(share_text)

    if api_result[:success]
      # 使用API返回的下载地址和标题
      result = XiaohongshuVideoDownloader.download_and_save(
        api_result[:download_url],
        api_result[:title],
        api_result[:description]
      )

      if result[:success]
        if result[:video_exists] && result[:video_record]
          VideoLinkCache.cache_video(share_text, result[:video_record])

          render json: {
            success: true,
            redirect_to: "/videos/#{result[:video_id]}",
            message: "视频已存在，正在跳转到视频详情页...",
            video_exists: true
          }
        else
          VideoLinkCache.cache_video(share_text, Video.find_by(id: result[:video_id])) if result[:video_id]

          render json: {
            success: true,
            redirect_to: "/videos",
            message: "视频下载成功，正在跳转到视频列表...",
            video_exists: false
          }
        end
      else
        render json: { success: false, error: result[:error] }, status: result[:status] || :internal_server_error
      end
    else
      render json: { success: false, error: api_result[:error] }, status: :bad_request
    end
  end
end
