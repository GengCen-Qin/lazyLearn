# 视频转录任务
# 处理视频文件的异步转录
class TranscriptionJob < ApplicationJob
  queue_as :new_transcription

  def perform(video_id, language = "en")
    Rails.logger.info "开始执行转录任务: Video ID: #{video_id}, Language: #{language}"

    video = Video.find(video_id)

    video.processing!

    TranscriptionService.new(video, language).process

    Rails.logger.info "转录任务完成: Video ID: #{video_id}, Title: #{video.title}"
  rescue StandardError => e
    Rails.logger.error "转录任务执行失败: Video ID: #{video_id}, Error: #{e.message}"
    Rails.logger.error e.backtrace.join("\n") if Rails.env.development?

    video&.failed!
  end
end
