class ReadingProgressesController < ApplicationController
  before_action :set_book

  # POST /reading_progresses
  def create
    return handle_permission_error unless user_has_access?

    start_line = params[:start_line].to_i
    end_line = params[:end_line].to_i

    return handle_invalid_params_error if invalid_params?(start_line, end_line)

    save_reading_progress(start_line, end_line)
  rescue => e
    handle_save_progress_error(e)
  end

  private

  def user_has_access?
    Current.user && Current.user.books.include?(@book)
  end

  def invalid_params?(start_line, end_line)
    start_line <= 0 || end_line <= 0 || start_line > end_line
  end

  def handle_permission_error
    respond_to do |format|
      format.turbo_stream { render turbo_stream: turbo_stream.update("progress-display", "权限不足") }
      format.json { render json: { error: "权限不足" }, status: :forbidden }
    end
  end

  def handle_invalid_params_error
    respond_to do |format|
      format.turbo_stream { render turbo_stream: turbo_stream.update("progress-display", "参数无效") }
      format.json { render json: { error: "参数无效" }, status: :bad_request }
    end
  end

  def save_reading_progress(start_line, end_line)
    progress = @book.reading_progress || @book.build_reading_progress(user: Current.user)
    progress.update!(start_line: start_line, end_line: end_line)

    prepare_progress_data(start_line, end_line)

    respond_to do |format|
      format.turbo_stream
      format.json { render json: { success: true, progress: { start_line: start_line, end_line: end_line } } }
    end
  end

  def prepare_progress_data(start_line, end_line)
    # 计算进度百分比
    @progress_percent = @book.total_lines.positive? ? ((end_line.to_f / @book.total_lines) * 100).round : 0
    @start_line = start_line
    @end_line = end_line
  end

  def handle_save_progress_error(error)
    Rails.logger.error "保存阅读进度失败: #{error.message}"

    respond_to do |format|
      format.turbo_stream { render turbo_stream: turbo_stream.update("progress-display", "保存进度失败") }
      format.json { render json: { error: "保存进度失败" }, status: :internal_server_error }
    end
  end

  private

  def set_book
    @book = Book.find_by(id: params[:book_id])

    render json: { error: "书籍不存在" }, status: :not_found if @book.nil?
  end
end
