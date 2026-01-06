class VideosController < ApplicationController
  allow_unauthenticated_access only: [ :index, :show ]
  try_user
  before_action :set_video, only: [ :show, :destroy ]

  # GET /videos
  def index
    if Current.user
      # 登录用户: 自己的视频 + 免费视频
      @pagy, @videos = pagy(
        Current.user.videos.order(created_at: :desc),
        limit: 5
      )
    else
      # 游客: 只显示免费视频
      @pagy, @videos = pagy(
        Video.free.order(created_at: :desc),
        limit: 5
      )
    end
  end

  # GET /videos/:id
  def show
    # 权限验证: 必须是免费视频，或是用户自己的视频
    unless @video.free? || (Current.user && Current.user.videos.include?(@video))
      redirect_to videos_url, alert: "您没有权限访问该视频"
    end
  end

  # DELETE /videos/:id
  def destroy
    @video.user_videos.where(user_id: Current.user.id).destroy_all

    redirect_to videos_url
  end

  private

  def set_video
    @video = Video.find_by(id: params[:id])

    redirect_to videos_url, alert: "视频不存在" if @video.nil?
  end

  def authenticate_user!
    unless Current.user
      redirect_to new_session_path, alert: "请先登录"
    end
  end
end
