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
      task_id = TencentAsrService.new.parse(@video.video_url)
      sleep 20
      unless [ :success, :failed ].include?(TencentAsrService.new.query(task_id).first)
        status, response = TencentAsrService.new.query(task_id)
        raise "Transcription failed: #{response} video:#{@video.id}" if status == :failed
      end
    when :whisper
      response = WhisperTranscriptionService.new.trans_video(@video.local_path)
    end

    @video.update!(
      transcription_segments: response["segments"],
      transcription_language: response["language"],
      transcription_time: Time.now,
      transcription_status: :completed
    )
  rescue => e
    Rails.logger.error("Transcription failed: #{e.message}")
    @video.failed!
  end
end
