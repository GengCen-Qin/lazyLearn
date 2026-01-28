class AudiosController < ApplicationController
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
    @audio = Audio.find_by_id(params[:id])

    if @audio.nil?
      redirect_to audios_path, alert: "音频不存在"
      return
    end

    # 检查用户权限
    if Current.user && !Current.user.audios.exists?(id: @audio.id)
      redirect_to audios_path, alert: "您没有访问此音频的权限"
    end
  end

  def destroy
    @audio = Audio.find(params[:id])

    # 检查用户权限
    unless Current.user&.audios&.exists?(id: @audio.id)
      redirect_to audios_path, alert: "您没有删除此音频的权限"
      return
    end

    @audio.destroy
    redirect_to audios_path, notice: "音频已删除"
  end
end
