class WelcomeController < ApplicationController
  def index
  end

  def download_xiaohongshu
    # Extract URL from request
    url = extract_url_from_request

    # Validate parameters
    unless url.present?
      render json: { success: false, error: "URL参数不能为空" }, status: :bad_request
      return
    end

    # Call service to handle the download and save logic
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

  private

  # Extract URL from either JSON request body or query parameters
  #
  # @return [String] the URL to download
  def extract_url_from_request
    if request.content_type == Mime::Type.lookup("application/json").to_s
      data = JSON.parse(request.raw_post)
      data["url"]
    else
      params[:url]
    end
  rescue JSON::ParserError
    nil
  end
end
