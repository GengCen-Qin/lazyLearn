# frozen_string_literal: true

class ChaptersController < ApplicationController
  before_action :set_book
  before_action :set_chapter, only: [:show, :prev, :next]

  # GET /books/:book_id/chapters
  def index
    @chapters = @book.chapters.order(:order_index)
  end

  # GET /books/:book_id/chapters/:id
  def show
    @chapters = @book.chapters.order(:order_index)
  end

  # GET /books/:book_id/chapters/:id/prev
  def prev
    @chapter = @book.chapters.where("order_index < ?", @chapter.order_index).order(:order_index).last
    render :show
  end

  # GET /books/:book_id/chapters/:id/next
  def next
    @chapter = @book.chapters.where("order_index > ?", @chapter.order_index).order(:order_index).first
    render :show
  end

  private

  def set_book
    @book = Book.find(params[:book_id])
  end

  def set_chapter
    @chapter = @book.chapters.find(params[:id])
  end
end
