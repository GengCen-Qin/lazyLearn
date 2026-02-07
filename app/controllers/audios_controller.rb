class AudiosController < ApplicationController
  allow_unauthenticated_access only: [ :index, :show, :read_mode ]
  try_user
  before_action :set_audio, only: [ :show, :read_mode, :destroy ]

  def index
    if Current.user
      @pagy, @audios = pagy(
        Current.user.audios.order(created_at: :desc),
        limit: 5
      )
    else
      @pagy, @audios = pagy(
        Audio.all.order(created_at: :desc),
        limit: 5
      )
    end
  end

  def show
    # 检查用户权限
    if Current.user && !Current.user.audios.exists?(id: @audio.id)
      redirect_to audios_path, alert: "您没有访问此音频的权限"
    end
  end

  # GET /audios/:id/read_mode
  def read_mode
    # 权限验证: 必须是用户自己的音频
    unless Current.user&.audios&.exists?(id: @audio.id)
      redirect_to audios_path, alert: "您没有权限访问该音频"
    end

    # 渲染通用模板
    render 'shared/read_mode'
  end

  def destroy
    # 检查用户权限
    unless Current.user&.audios&.exists?(id: @audio.id)
      redirect_to audios_path, alert: "您没有删除此音频的权限"
      return
    end

    @audio.destroy
    redirect_to audios_path, notice: "音频已删除"
  end

  private

  def set_audio
    @audio = Audio.find_by(id: params[:id])

    redirect_to audios_path, alert: "音频不存在" if @audio.nil?
  end
end
