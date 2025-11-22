# 视频转录任务
# 处理视频文件的异步转录
class TranscriptionJob < ApplicationJob
  # 设置队列为转录专用队列
  queue_as :transcription

  # 失败时重试策略
  # 转录服务临时不可用时重试，最多重试3次
  retry_on StandardError, wait: :exponentially_longer, attempts: 3 do |job, error|
    Rails.logger.error "TranscriptionJob最终失败: Video ID: #{job.arguments[0]}, Error: #{error.message}"

    # 更新视频状态为失败
    video_id = job.arguments[0]
    Video.find_by(id: video_id)&.failed!
  end

  # 如果视频记录不存在，丢弃任务
  discard_on ActiveRecord::RecordNotFound do |job, error|
    Rails.logger.warn "TranscriptionJob被丢弃: Video ID: #{job.arguments[0]} 不存在"
  end

  def perform(video_id, language = "zh")
    Rails.logger.info "开始执行转录任务: Video ID: #{video_id}, Language: #{language}"

    video = Video.find(video_id)

    raise "视频文件不存在: Video ID: #{video_id}" unless video.has_video_file?

    raise "不支持的语言: #{language}" unless video.transcription_language.in? %w[zh en ja ko es fr de]

    video.processing!

    TranscriptionService.new(video, language).process

    Rails.logger.info "转录任务完成: Video ID: #{video_id}, Title: #{video.title}"
  rescue StandardError => e
    Rails.logger.error "转录任务执行失败: Video ID: #{video_id}, Error: #{e.message}"
    Rails.logger.error e.backtrace.join("\n") if Rails.env.development?

    video&.failed!

    raise e
  end
end
