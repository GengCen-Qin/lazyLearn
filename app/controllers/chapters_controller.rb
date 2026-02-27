# frozen_string_literal: true

class ChaptersController < ApplicationController
  before_action :set_book
  before_action :set_chapter, only: [ :show ]

  # GET /books/:book_id/chapters
  def index
    @chapters = @book.chapters.order(:order_index)
  end

  # GET /books/:book_id/chapters/:id
  def show
    @chapters = @book.chapters.order(:order_index)
    @prev = @chapter.prev
    @next = @chapter.next

    # 更新阅读进度
    update_reading_progress
  end

  def update_reading_progress
    progress = @book.reading_progress || @book.build_reading_progress(user: Current.user)
    progress.chapter = @chapter
    progress.start_line ||= 0
    progress.end_line ||= 0
    progress.save!
  end

  private

  def set_book
    @book = Book.find(params[:book_id])
  end

  def set_chapter
    @chapter = @book.chapters.find(params[:id])
  end
end
