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
    Video.find_by(id: video_id)&.update!(transcription_status: 'failed')
  end

  # 如果视频记录不存在，丢弃任务
  discard_on ActiveRecord::RecordNotFound do |job, error|
    Rails.logger.warn "TranscriptionJob被丢弃: Video ID: #{job.arguments[0]} 不存在"
  end

  def perform(video_id, language = 'zh')
    Rails.logger.info "开始执行转录任务: Video ID: #{video_id}, Language: #{language}"

    # 查找视频记录
    video = Video.find(video_id)

    # 验证视频文件存在
    unless video.has_video_file?
      raise "视频文件不存在: Video ID: #{video_id}"
    end

    # 验证语言支持
    unless video.transcription_language.in? %w[zh en ja ko es fr de]
      raise "不支持的语言: #{language}"
    end

    # 更新状态为处理中
    video.update!(transcription_status: 'processing')

    # 使用转录服务处理
    service = TranscriptionService.new(video, language)
    service.process

    Rails.logger.info "转录任务完成: Video ID: #{video_id}, Title: #{video.title}"

  rescue StandardError => e
    Rails.logger.error "转录任务执行失败: Video ID: #{video_id}, Error: #{e.message}"
    Rails.logger.error e.backtrace.join("\n") if Rails.env.development?

    # 更新视频状态为失败（如果重试次数用尽，retry_on块会处理）
    video&.update!(transcription_status: 'failed')

    # 重新抛出异常以触发重试机制
    raise e
  end

  # 任务成功完成后的回调
  def success(job)
    video_id = job.arguments[0]
    Rails.logger.info "TranscriptionJob成功完成: Video ID: #{video_id}"
  end

  # 任务重试前的回调
  def retry(job, exception)
    video_id = job.arguments[0]
    attempt = job.executions

    Rails.logger.warn "TranscriptionJob重试: Video ID: #{video_id}, Attempt: #{attempt}, Error: #{exception.message}"

    # 更新视频状态为pending（重试中）
    Video.find_by(id: video_id)&.update!(transcription_status: 'pending')
  end

  # 任务最终失败的回调
  def discard(job, exception)
    video_id = job.arguments[0]
    Rails.logger.error "TranscriptionJob最终被丢弃: Video ID: #{video_id}, Error: #{exception.message}"
  end
end