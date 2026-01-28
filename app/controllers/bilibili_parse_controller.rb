class BilibiliParseController < ApplicationController
  allow_unauthenticated_access only: [ :create ]
  try_user

  def create
    url = params[:url]

    unless url.present?
      render json: { success: false, error: "Bilibili链接不能为空" }, status: :bad_request
      return
    end

    begin
      result = Downloader::Bilibili.new.parse(url)

      ActiveRecord::Base.transaction do
        audio = Audio.create!(
          title: result[:filename],
          description: result[:description],
          remote_url: result[:audio_url],
          transcription_status: :pending
        )

        if Current.user
          Current.user.user_audios.find_or_create_by(audio: audio)
        end
      end

      render json: {
        success: true,
        redirect_to: "/audios",
        message: "音频正在解析，正在跳转到音频列表页...",
        audio_exists: true
      }
    rescue Downloader::Bilibili::NotSupportException => e
      render json: { success: false, error: e.message, not_support: true }, status: :bad_request
    rescue => e
      render json: { success: false, error: "系统异常，请稍后重试: #{e.message}" }, status: :internal_server_error
    end
  end
end
