class WelcomeController < ApplicationController
  def index
  end

  def download_xiaohongshu
    share_text = params[:url]

    unless share_text.present?
      render json: { success: false, error: "分享内容不能为空" }, status: :bad_request
      return
    end

    # 首先尝试从API获取内容信息
    api_result = XiaohongshuApiService.extract_content(share_text)

    if api_result[:success]
      # 使用API返回的下载地址和标题
      result = XiaohongshuVideoDownloader.download_and_save(
        api_result[:download_url],
        api_result[:title],
        api_result[:description]
      )

      if result[:success]
        render json: {
          success: true,
          file_path: result[:file_path],
          file_name: result[:file_name],
          title: api_result[:title]
        }
      else
        render json: { success: false, error: result[:error] }, status: result[:status] || :internal_server_error
      end
    else
      render json: { success: false, error: api_result[:error] }, status: :bad_request
    end
  end
end
