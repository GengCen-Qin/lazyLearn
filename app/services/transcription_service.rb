class TranscriptionService
  # @param [Video] video - The video to be transcribe.
  # @param [String] language - The language of the video.
  # @param [Symbol] tool - 使用哪个工具处理（:tencent 腾讯, :whisper OpenAI）
  def initialize(video, language = "en", tool = :tencent)
    @video = video
    @language = language
    @tool = tool
  end

  def process
    case @tool
    when :tencent
      task_id = TencentAsrService.new.parse(@video.ori_video_url)
      Rails.logger.info "tencent asr start #{task_id}, video: #{@video.id}"
      sleep 15

      while [ :success, :failed ].exclude?(TencentAsrService.new.query(task_id).first) do
        sleep 1
      end

      status, response = TencentAsrService.new.query(task_id)
      raise "Transcription failed: #{response} video:#{@video.id}" if status == :failed
    when :whisper
      Rails.logger.info "whisper asr start video: #{@video.id}"
      response = WhisperTranscriptionService.new.trans_video(@video.local_path)
    end
    binding.irb
    @video.update!(
      transcription_segments: response["segments"],
      transcription_language: response["language"],
      transcription_time: Time.now,
      transcription_status: :completed
    )
  rescue => e
    Rails.logger.error("Transcription failed: #{e.message}, #{e.backtrace.join("\n")}")
    @video.failed!
  end
end
