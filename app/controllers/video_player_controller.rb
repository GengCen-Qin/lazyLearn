class VideoPlayerController < ApplicationController
  def index
    # 获取所有视频（不仅仅是已完成转录的）
    @videos = Video.all.order(created_at: :desc)

    # 如果指定了视频ID，则设置为当前视频
    if params[:video_id].present?
      @current_video = Video.find(params[:video_id])
    else
      # 默认显示第一个视频（如果有）
      @current_video = @videos.first
    end
  end

  # 检查视频转录状态
  def status
    video_id = params[:video_id]
    return render json: { error: 'video_id parameter is required' }, status: :bad_request if video_id.blank?

    video = Video.find_by(id: video_id)
    return render json: { error: 'Video not found' }, status: :not_found unless video

    render json: {
      success: true,
      video_id: video.id,
      transcription_status: video.transcription_status,
      transcription_status_text: video.transcription_status_text,
      has_transcription: video.has_transcription?,
      transcription_segments_count: video.has_transcription? ? video.transcription_segments.size : 0
    }
  end
end