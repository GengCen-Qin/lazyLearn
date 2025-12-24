class VideosController < ApplicationController
  allow_unauthenticated_access only: [ :index, :show, :destroy ]
  before_action :set_video, only: [ :show, :destroy ]

  # GET /videos
  def index
    @pagy, @videos = pagy(Video.all.order(created_at: :desc), limit: 10)
  end

  # GET /videos/:id
  def show
    # 视频详情页面，复用 video_player 页面
  end

  # DELETE /videos/:id
  def destroy
    if @video.destroy
      redirect_to videos_url, notice: "视频删除成功。"
    else
      redirect_to videos_url, alert: "视频删除失败。"
    end
  end

  private

  def set_video
    @video = Video.find(params[:id])
  end
end
