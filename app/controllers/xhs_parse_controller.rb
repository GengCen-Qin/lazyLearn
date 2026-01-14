class XhsParseController < ApplicationController
  allow_unauthenticated_access only: [ :create ]
  try_user

  def create
    unless Current.user
      render json: {
        success: false,
        need_login: true,
        error: "请先登录",
        redirect_to: "/session/new"
      }, status: :unauthorized
      return
    end

    unless Current.user.can_use_quota?
      render json: {
        success: false,
        error: "您的免费额度已用完，请联系管理员充值",
        no_quota: true
      }, status: :forbidden
      return
    end

    share_text = params[:url]

    unless share_text.present?
      render json: { success: false, error: "分享内容不能为空" }, status: :bad_request
      return
    end

    begin
      result = Downloader::Xhs.new.parse(share_text)

      ActiveRecord::Base.transaction do
        video = Video.create!(
          title: result[:filename],
          description: result[:description],
          download_link: result[:ori_url],
          ori_video_url: result[:ori_video_url],
          transcription_status: :pending
        )

        Current.user.user_videos.find_or_create_by(video: video)

        Current.user.use_quota(
          status: UsageRecord::STATUS_TYPES[:success],
          ip_address: request.remote_ip,
          user_agent: request.user_agent
        )
      end

      render json: {
        success: true,
        redirect_to: "/videos",
        message: "视频正在解析，正在跳转到视频详情页...",
        video_exists: true
      }
    rescue Downloader::Xhs::NotSupportException => e
      Current.user.use_quota(
        status: UsageRecord::STATUS_TYPES[:failed],
        notes: e.message,
        ip_address: request.remote_ip,
        user_agent: request.user_agent
      )

      render json: { success: false, error: e.message, not_support: true }, status: :bad_request
    rescue => e
      if e.message == "免费额度已用完" || e.message == "没有可用配额"
        render json: {
          success: false,
          error: "您的免费额度已用完，请联系管理员充值",
          no_quota: true
        }, status: :forbidden
      else
        Current.user.use_quota(
          status: UsageRecord::STATUS_TYPES[:failed],
          notes: "系统异常: #{e.message}",
          ip_address: request.remote_ip,
          user_agent: request.user_agent
        )

        render json: { success: false, error: "系统异常，请稍后重试" }, status: :internal_server_error
      end
    end
  end
end
