class XhsParseController < ApplicationController
  def create
    share_text = params[:url]

    unless share_text.present?
      render json: { success: false, error: "分享内容不能为空" }, status: :bad_request
      return
    end

    result = Downloader::Xhs.new.parse(share_text)

    if result[:success]
      video = Video.create!(
        title: result[:filename],
        description: result[:description],
        download_link: result[:ori_url],
        ori_video_url: result[:ori_video_url],
        transcription_status: :pending
      )

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
