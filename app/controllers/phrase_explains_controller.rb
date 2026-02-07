class PhraseExplainsController < ApplicationController
  allow_unauthenticated_access only: [ :create ]
  try_user

  # POST /phrase_explain
  def create
    text_param = params[:text].to_s.strip

    if text_param.blank?
      render json: { success: false, error: "文本不能为空" }, status: :bad_request
      return
    end

    if text_param.length < 3
      render json: { success: false, error: "请选择至少3个字符的文本来获得解释" }, status: :bad_request
      return
    end

    if text_param.length > 500
      render json: { success: false, error: "文本长度不能超过500个字符" }, status: :bad_request
      return
    end

    begin
      # 调用短语解释服务
      result = PhraseExplainService.new(text_param).call

      if result[:success]
        render json: {
          success: true,
          explanation: result[:explanation]
        }
      else
        render json: {
          success: false,
          error: result[:error] || "无法获取解释，请稍后再试"
        }, status: :internal_server_error
      end
    rescue => error
      Rails.logger.error("Phrase explain error: #{error.message}")
      Rails.logger.error(error.backtrace.join("\n"))

      render json: {
        success: false,
        error: "抱歉，服务暂时不可用，请稍后再试。"
      }, status: :internal_server_error
    end
  end

  private

  def phrase_explain_params
    params.require(:text)
    params.permit(:text)
  end
end
