# 音频转录任务
# 处理音频文件的异步转录
class AudioTranscriptionJob < ApplicationJob
  queue_as :new_transcription

  def perform(audio_id, language = "en")
    Rails.logger.info "开始执行音频转录任务: Audio ID: #{audio_id}, Language: #{language}"

    audio = Audio.find(audio_id)

    # 等待音频文件附加完成
    if Rails.env.development?
      until audio.audio_file.attached?
        sleep 1
      end
    end

    audio.processing!

    AudioTranscriptionService.new(audio, language).process

    Rails.logger.info "音频转录任务完成: Audio ID: #{audio_id}, Title: #{audio.title}"
  rescue StandardError => e
    Rails.logger.error "音频转录任务执行失败: Audio ID: #{audio_id}, Error: #{e.message}"
    Rails.logger.error e.backtrace.join("\n") if Rails.env.development?

    audio&.failed!
  end
end