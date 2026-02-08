class BooksController < ApplicationController
  allow_unauthenticated_access only: [ :index, :show ]
  try_user
  before_action :set_book, only: [ :show ]

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
    unless Current.user && Current.user.books.include?(@book)
      redirect_to books_url, alert: "您没有权限访问该书籍"
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

    # 检查文件类型
    unless uploaded_file.content_type == "text/plain"
      redirect_to books_url, alert: "只支持上传 TXT 格式的文件"
      return
    end

    # 检查文件大小（限制为 10MB）
    if uploaded_file.size > 10.megabytes
      redirect_to books_url, alert: "文件大小不能超过 10MB"
      return
    end

    begin
      # 使用 TxtBookParsable 解析文件
      book = Book.parse_from_io(uploaded_file, Current.user.id, params[:title])
      redirect_to book_path(book), notice: "电子书上传成功！"
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
