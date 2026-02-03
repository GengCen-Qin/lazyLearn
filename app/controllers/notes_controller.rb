class NotesController < ApplicationController
  before_action :set_note, only: [ :show, :edit, :update, :destroy ]
  before_action :require_user

  def index
    @pagy, @notes = pagy(
      Current.user.notes.order(created_at: :desc),
      limit: 10
    )
  end

  def show
    # 更新最后复习时间
    @note.mark_as_reviewed
  end

  def new
    @note = Current.user.notes.new
  end

  def edit
  end

  def create
    @note = Current.user.notes.new(note_params)

    if @note.save
      redirect_to notes_path, notice: "笔记创建成功"
    else
      render :new, status: :unprocessable_entity
    end
  end

  def update
    if @note.update(note_params)
      redirect_to note_path(@note), notice: "笔记更新成功"
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @note.destroy
    redirect_to notes_path, notice: "笔记删除成功"
  end

  private

  def set_note
    @note = Current.user.notes.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    redirect_to notes_path, alert: "笔记不存在"
  end

  def note_params
    params.require(:note).permit(:content, :question, :note)
  end

  def require_user
    unless Current.user
      redirect_to new_session_path, alert: "请先登录"
    end
  end
end
