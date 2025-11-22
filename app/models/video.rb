class Video < ApplicationRecord
  has_one_attached :video_file

  enum :transcription_status, { pending: 0, processing: 1, completed: 2, failed: 3 }

  # 验证
  validates :title, presence: true
  validates :transcription_language, inclusion: { in: %w[zh en ja ko es fr de], message: "%{value} 不是支持的语言" }

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
    update!(transcription_language: language, transcription_status: :pending)
    TranscriptionJob.perform_later(id, language)
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
