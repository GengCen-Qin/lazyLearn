class DownloadsController < ApplicationController
  allow_unauthenticated_access only: [ :create ]
  try_user

  # POST /downloads
  # 统一的下载解析接口，支持小红书和Bilibili链接
  #
  # 参数:
  #   url: 要解析的链接（小红书或Bilibili）
  #
  # 返回:
  #   JSON格式的响应，包含解析结果和重定向信息
  def create
    url = params[:url]

    unless url.present?
      render json: { success: false, error: "链接不能为空" }, status: :bad_request
      return
    end

    # 检测平台类型
    platform = detect_platform(url)

    case platform
    when :xhs
      process_xhs(url)
    when :bilibili
      process_bilibili(url)
    else
      render json: {
        success: false,
        error: "不支持的链接格式。请提供小红书(xhslink.com/xiaohongshu.com)或Bilibili(bilibili.com)链接"
      }, status: :bad_request
    end
  end

  private

  # 检测URL所属平台
  def detect_platform(url)
    if url.include?("xhslink.com") || url.include?("xiaohongshu.com")
      :xhs
    elsif url.include?("bilibili.com")
      :bilibili
    else
      nil
    end
  end

  # 处理小红书链接
  def process_xhs(url)
    # 检查用户登录状态
    unless Current.user
      render json: {
        success: false,
        need_login: true,
        error: "请先登录",
        redirect_to: "/session/new"
      }, status: :unauthorized
      return
    end

    # 检查用户配额
    unless Current.user.can_use_quota?
      render json: {
        success: false,
        error: "您的免费额度已用完，请联系管理员充值",
        no_quota: true
      }, status: :forbidden
      return
    end

    begin
      # 调用现有的小红书下载器服务
      result = Downloader::Xhs.new.parse(url)

      unless result[:success]
        render json: { success: false, error: "解析失败" }, status: :bad_request
        return
      end

      ActiveRecord::Base.transaction do
        # 创建视频记录
        video = Video.create!(
          title: result[:filename],
          description: result[:description],
          download_link: result[:ori_url],
          ori_video_url: result[:ori_video_url],
          transcription_status: :pending
        )

        # 关联用户和视频
        Current.user.user_videos.find_or_create_by(video: video)

        # 记录使用配额
        Current.user.use_quota(
          status: UsageRecord::STATUS_TYPES[:success],
          ip_address: request.remote_ip,
          user_agent: request.user_agent
        )
      end

      render json: {
        success: true,
        platform: :xhs,
        redirect_to: "/videos",
        message: "视频正在解析，正在跳转到视频详情页...",
        video_exists: true
      }

    rescue Downloader::Xhs::NotSupportException => e
      # 记录失败配额
      Current.user.use_quota(
        status: UsageRecord::STATUS_TYPES[:failed],
        notes: e.message,
        ip_address: request.remote_ip,
        user_agent: request.user_agent
      )

      render json: {
        success: false,
        error: e.message,
        not_support: true,
        platform: :xhs
      }, status: :bad_request

    rescue => e
      if e.message == "免费额度已用完" || e.message == "没有可用配额"
        render json: {
          success: false,
          error: "您的免费额度已用完，请联系管理员充值",
          no_quota: true,
          platform: :xhs
        }, status: :forbidden
      else
        # 记录系统异常
        Current.user.use_quota(
          status: UsageRecord::STATUS_TYPES[:failed],
          notes: "系统异常: #{e.message}",
          ip_address: request.remote_ip,
          user_agent: request.user_agent
        )

        render json: {
          success: false,
          error: "系统异常，请稍后重试",
          platform: :xhs
        }, status: :internal_server_error
      end
    end
  end

  # 处理Bilibili链接
  def process_bilibili(url)
    begin
      # 调用现有的Bilibili下载器服务
      result = Downloader::Bilibili.new.parse(url)

      unless result[:success]
        render json: { success: false, error: "解析失败" }, status: :bad_request
        return
      end

      ActiveRecord::Base.transaction do
        # 创建音频记录
        audio = Audio.create!(
          title: result[:filename],
          description: result[:description],
          remote_url: result[:audio_url],
          transcription_status: :pending
        )

        # 如果用户已登录，关联用户和音频
        if Current.user
          Current.user.user_audios.find_or_create_by(audio: audio)
        end
      end

      render json: {
        success: true,
        platform: :bilibili,
        redirect_to: "/audios",
        message: "音频正在解析，正在跳转到音频列表页...",
        audio_exists: true
      }

    rescue Downloader::Bilibili::NotSupportException => e
      render json: {
        success: false,
        error: e.message,
        not_support: true,
        platform: :bilibili
      }, status: :bad_request

    rescue => e
      render json: {
        success: false,
        error: "系统异常，请稍后重试: #{e.message}",
        platform: :bilibili
      }, status: :internal_server_error
    end
  end
end
