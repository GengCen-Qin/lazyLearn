class XhsParseController < ApplicationController
  allow_unauthenticated_access only: [ :create ]
  try_user

  def create
    # 检查用户是否登录
    unless Current.user
      render json: {
        success: false,
        need_login: true,
        error: "请先登录",
        redirect_to: "/session/new"
      }, status: :unauthorized
      return
    end

    share_text = params[:url]

    unless share_text.present?
      render json: { success: false, error: "分享内容不能为空" }, status: :bad_request
      return
    end

    begin
      result = Downloader::Xhs.new.parse(share_text)
    rescue Downloader::Xhs::NotSupportException => e
      render json: { success: false, error: "该链接格式暂不支持", not_support: true }, status: :bad_request
      return
    end

    if result[:success]
      video = Video.create!(
        title: result[:filename],
        description: result[:description],
        download_link: result[:ori_url],
        ori_video_url: result[:ori_video_url],
        transcription_status: :pending
      )

      Current.user.user_videos.find_or_create_by(video: video)

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
