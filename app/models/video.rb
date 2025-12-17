# == Schema Information
#
# Table name: videos
#
#  id                     :integer          not null, primary key
#  description            :text
#  download_link          :string
#  ori_video_url          :string
#  title                  :string
#  transcription_language :string           default("zh")
#  transcription_segments :json
#  transcription_status   :integer          default("pending"), not null
#  transcription_time     :datetime
#  created_at             :datetime         not null
#  updated_at             :datetime         not null
#
# Indexes
#
#  index_videos_on_download_link           (download_link) UNIQUE
#  index_videos_on_transcription_language  (transcription_language)
#  index_videos_on_transcription_status    (transcription_status)
#
class Video < ApplicationRecord
  has_one_attached :video_file

  enum :transcription_status, { pending: 0, processing: 1, completed: 2, failed: 3 }

  # 验证
  validates :title, presence: true
  validates :transcription_language, inclusion: { in: %w[zh en ja ko es fr de], message: "%{value} 不是支持的语言" }

  after_save_commit do
    local_upload_async if Rails.env.development?
    oss_upload_async if Rails.env.production?
    trigger_transcription_async
  end

  def local_path
    return nil unless video_file.attached?
    video_file.blob.service.send(:path_for, video_file.blob.key)
  end

  # 转录相关方法
  def has_transcription?
    transcription_segments.present? && transcription_segments.any?
  end

  def transcription_completed?
    completed? && has_transcription?
  end

  def has_video_file?
    video_file.attached?
  end

  # 触发转录（异步）
  def trigger_transcription_async(language: "en")
    TranscriptionJob.perform_later(id, language)
  end

  # OSS云存储
  def oss_upload_async
    CosUploadJob.perform_later(id)
  end

  # 本地存储（开发测试环境）
  def local_upload_async
    LocalUploadJob.perform_later(id)
  end

  # 获取OSS临时链接
  def oss_link
    return if ori_video_url.blank? || !Rails.env.production?

    response = Typhoeus.post(
      "http://new_web-cos:8080/api/v1/presigned-url",
      headers: { "Content-Type" => "application/json" },
      body: { file_path: ori_video_url.split("/")[-1] + ".mp4" }.to_json
    )

    if response.success?
      JSON.parse(response.body)["presigned_url"]
    else
      Rails.logger.error "OSS 获取链接失败: #{response.code}, #{response.body}"
    end
  end

  # 触发转录（同步，主要用于调试）
  def trigger_transcription(language: "en")
    update!(transcription_language: language, transcription_status: :processing)

    service = TranscriptionService.new(self, language)
    service.process

    self
  rescue StandardError => e
    Rails.logger.error "转录失败: #{e.message}"
    failed!
    self
  end

  # 格式化转录数据为前端可用的格式
  def formatted_transcription
    return [] unless has_transcription?

    transcription_segments.map do |segment|
      {
        start: segment["start"],
        end: segment["end"],
        text: segment["text"],
        time_str: segment["time_str"]
      }
    end
  end

  # 获取转录状态文本（中文）
  def transcription_status_text
    case transcription_status
    when "pending"
      "等待转录"
    when "processing"
      "正在转录"
    when "completed"
      "转录完成"
    when "failed"
      "转录失败"
    else
      "未知状态"
    end
  end
end
