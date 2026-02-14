# == Schema Information
#
# Table name: audios
#
#  id                     :integer          not null, primary key
#  description            :text
#  free                   :boolean          default(FALSE), not null
#  remote_url             :string
#  subtitle_content       :text
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
#  index_audios_on_free                    (free)
#  index_audios_on_remote_url              (remote_url) UNIQUE
#  index_audios_on_transcription_language  (transcription_language)
#  index_audios_on_transcription_status    (transcription_status)
#
class Audio < ApplicationRecord
  has_one_attached :audio_file, dependent: :purge
  has_many :user_audios, dependent: :destroy
  has_many :users, through: :user_audios

  enum :transcription_status, { pending: 0, processing: 1, completed: 2, failed: 3 }

  # Scopes
  scope :free, -> { where(free: true) }

  after_create_commit do
    local_upload_async
    trigger_transcription_async
  end

  def local_path
    return nil unless audio_file.attached?
    audio_file.blob.service.send(:path_for, audio_file.blob.key)
  end

  def has_transcription?
    transcription_segments.present? && transcription_segments.any?
  end

  def transcription_completed?
    completed? && has_transcription?
  end

  def has_audio_file?
    audio_file.attached?
  end

  def trigger_transcription_async(language: "en")
    AudioTranscriptionJob.perform_now(id, language)
  end

  def local_upload_async
    AudioLocalUploadJob.perform_now(id)
  end

  def trigger_transcription(language: "en")
    update!(transcription_language: language, transcription_status: :processing)

    service = AudioTranscriptionService.new(self, language)
    service.process

    self
  rescue StandardError => e
    Rails.logger.error "音频转录失败: #{e.message}"
    failed!
    self
  end

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
