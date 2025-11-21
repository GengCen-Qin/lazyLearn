class WelcomeController < ApplicationController
  def index
  end

  def download_xiaohongshu
    url = params[:url]

    unless url.present?
      render json: { success: false, error: "URL参数不能为空" }, status: :bad_request
      return
    end

    result = XiaohongshuVideoDownloader.download_and_save(url)

    if result[:success]
      render json: {
        success: true,
        file_path: result[:file_path],
        file_name: result[:file_name]
      }
    else
      render json: { success: false, error: result[:error] }, status: result[:status] || :internal_server_error
    end
  end
end
