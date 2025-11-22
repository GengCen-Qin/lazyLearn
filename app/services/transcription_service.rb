class TranscriptionService
  def initialize(video, language = "zh")
    @video = video
    @language = language
  end

  def process
    response = HTTParty.post(
      "http://localhost:8000/transcribe",
      body: {
        file_path: @video.local_path,
        language: @language
      }.to_json,
      headers: { "Content-Type" => "application/json" }
    )

    if response.success?
      data = response.parsed_response
      @video.update!(
        transcription_segments: data["segments"],
        transcription_language: data["language"],
        transcription_time: data["transcription_time"],
        transcription_status: :completed
      )
    else
      @video.failed!
    end
  end
end
