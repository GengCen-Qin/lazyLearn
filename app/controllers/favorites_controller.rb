class FavoritesController < ApplicationController
  before_action :require_authentication
  before_action :set_word, only: [:create]

  # GET /favorites
  def index
    favorite_records = Current.user.favorites.order(created_at: :desc)
    word_ids = favorite_records.pluck(:word_id)
    @favorites = EcdictWord.where(id: word_ids)
  end

  # GET /favorites/check
  def check
    favorited = Current.user.favorites.exists?(word_id: params[:word_id])
    render json: { favorited: favorited }
  end

  # POST /favorites
  def create
    @favorite = Current.user.favorites.find_or_create_by(word: @word)

    respond_to do |format|
      format.json { render json: { success: true, favorited: true } }
      format.turbo_stream
    end
  end

  # DELETE /favorites/:id
  def destroy
    @favorite = Current.user.favorites.find_by(word_id: params[:id])
    @word = EcdictWord.find_by(id: params[:id])

    if @favorite&.destroy
      respond_to do |format|
        format.json { render json: { success: true, favorited: false } }
        format.turbo_stream
      end
    else
      respond_to do |format|
        format.json { render json: { success: false }, status: :not_found }
      end
    end
  end

  private

  def set_word
    @word = EcdictWord.find_by(id: params[:word_id])
    unless @word
      respond_to do |format|
        format.json { render json: { success: false, message: '单词不存在' }, status: :not_found }
      end
    end
  end
end
