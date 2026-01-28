class AudioTranscriptionService
  # @param [Audio] audio - The audio to be transcribe.
  # @param [String] language - The language of the audio.
  # @param [Symbol] tool - 使用哪个工具处理（:tencent 腾讯, :whisper OpenAI）
  def initialize(audio, language = "en", tool = nil)
    @audio = audio
    @language = language
    @tool = Rails.env.development? ? :whisper : tool || :tencent
  end

  def process
    case @tool
    when :whisper
      response = WhisperTranscriptionService.new.trans_audio_with_whisper_cpp(@audio.local_path, language: @language)
    else
      raise "不支持的工具: #{@tool}"
    end

    @audio.update!(
      transcription_segments: response["segments"],
      transcription_language: response["language"],
      transcription_time: Time.now,
      transcription_status: :completed
    )
  rescue => e
    Rails.logger.error("音频转录失败: #{e.message}, #{e.backtrace.join("\n")}")
    @audio.failed!
  end
end
