class BooksController < ApplicationController
  allow_unauthenticated_access only: [ :index, :show ]
  try_user
  before_action :set_book, only: [ :show, :load_content ]

  # GET /books
  def index
    if Current.user
      @pagy, @books = pagy(
        Current.user.books.order(created_at: :desc),
        limit: 10
      )
    else
      redirect_to new_session_path, alert: "请先登录"
    end
  end

  # GET /books/:id
  def show
  end

  # POST /books/:id/content
  def load_content
    before_line = params[:before_line]&.to_i || 0
    after_line = params[:after_line]&.to_i || 0
    limit = params[:limit].to_i.positive? ? params[:limit].to_i : 50

    @contents = load_book_contents(before_line, after_line, limit)

    @prepend = before_line.positive?
    @initial_load = !before_line.positive? && !after_line.positive?

    calculate_progress_data if @contents.present?

    respond_to do |format|
      format.turbo_stream
      format.json do
        render json: build_json_response(before_line, after_line, limit)
      end
    end
  rescue => e
    handle_load_content_error(e)
  end

  def load_book_contents(before_line, after_line, limit)
    if before_line.positive?
      # 向上加载
      start_line = [ before_line - limit, 1 ].max
      @book.book_contents
        .where(line_number: start_line..before_line - 1)
        .order(line_number: :asc)
        .limit(limit)
    elsif after_line.positive?
      # 向下加载
      @book.book_contents
        .where("line_number > ?", after_line)
        .order(line_number: :asc)
        .limit(limit)
    else
      # 初始加载
      start_line = params[:start_line].to_i.positive? ? params[:start_line].to_i : 1
      @book.book_contents
        .where(line_number: start_line..start_line + limit - 1)
        .order(line_number: :asc)
        .limit(limit)
    end
  end

  def calculate_progress_data
    @first_line = @contents.first.line_number
    @last_line = @contents.last.line_number
    @progress_percent = ((@last_line.to_f / @book.total_lines) * 100).round
  end

  def build_json_response(before_line, after_line, limit)
    {
      contents: @contents.map { |c| { line_number: c.line_number, content: c.content } },
      has_more_before: before_line.positive? && (before_line - limit) > 1,
      has_more_after: (after_line.positive? || @initial_load) && @contents.size == limit
    }
  end

  def handle_load_content_error(error)
    Rails.logger.error "加载书籍内容失败: #{error.message}"
    respond_to do |format|
      format.turbo_stream { render turbo_stream: turbo_stream.update("book-content", "<div class='text-center text-red-600 py-8'>加载内容失败</div>") }
      format.json { render json: { error: "加载内容失败" }, status: :internal_server_error }
    end
  end

  # POST /books
  def create
    unless Current.user
      redirect_to books_url, alert: "请先登录"
      return
    end

    if params[:book_file].blank?
      redirect_to books_url, alert: "请选择要上传的文件"
      return
    end

    uploaded_file = params[:book_file]

    unless uploaded_file.content_type == "application/epub+zip"
      redirect_to books_url, alert: "只支持 EPUB 格式的文件"
      return
    end

    if uploaded_file.size > 50.megabytes
      redirect_to books_url, alert: "文件大小不能超过 50MB"
      return
    end

    begin
      book = Book.parse_from_io(uploaded_file, Current.user.id)
      redirect_to book_chapter_path(book, book.chapters.first), notice: "电子书上传成功！"
    rescue => e
      Rails.logger.error "电子书上传失败: #{e.message}"
      redirect_to books_url, alert: "文件解析失败：#{e.message}"
    end
  end

  private

  def set_book
    @book = Book.find_by(id: params[:id])

    redirect_to books_url, alert: "书籍不存在" if @book.nil?
  end
end
