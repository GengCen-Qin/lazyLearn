class WordLookupController < ApplicationController
  # POST /word_lookup
  def create
    result = WordLookupService.call(params[:word])

    if result.success?
      render json: {
        success: true,
        word: result.word_data
      }
    else
      render json: {
        success: false,
        message: result.message
      }, status: result.http_status
    end
  end
end
