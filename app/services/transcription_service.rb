class TranscriptionService
  # @param [Video] video - The video to be transcribe.
  # @param [String] language - The language of the video.
  def initialize(video, language = "en")
    @video = video
    @language = language
  end

  def process
    response = WhisperTranscriptionService.new.trans_video(@video.local_path)
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
