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

    result = Downloader::Xhs.new.parse(share_text)

    if result[:success]
      video = Video.create!(
        title: result[:filename],
        description: result[:description],
        download_link: result[:ori_url],
        ori_video_url: result[:ori_video_url]
      )

      video.video_file.attach(result.slice(:io, :filename, :content_type))
      video.trigger_transcription_async
      VideoLinkCache.cache_video(share_text, video)

      render json: {
        success: true,
        redirect_to: "/videos",
        message: "视频正在解析，正在跳转到视频详情页...",
        video_exists: true
      }
    else
      render json: { success: false, error: "处理异常" }, status: :bad_request
    end
  end
end
