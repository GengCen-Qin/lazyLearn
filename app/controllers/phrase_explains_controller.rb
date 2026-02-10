class PhraseExplainsController < ApplicationController
  include ActionController::Live
  allow_unauthenticated_access only: [ :create, :stream ]
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

  # GET /phrase_explain/stream?text=xxx
  def stream
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
      response.headers['Content-Type'] = 'text/event-stream'
      response.headers['Last-Modified'] = Time.now.httpdate
      sse = SSE.new(response.stream, retry: 300)

      # 构建提示词
      prompt = build_prompt(text_param)

      OpenAiClient.chat_stream(prompt) do |chunk|
        sse.write(chunk)
      end
    rescue => error
      Rails.logger.error("Phrase explain stream error: #{error.message}")
      Rails.logger.error(error.backtrace.join("\n"))
    ensure
      sse.close
    end
  end

  private

  def phrase_explain_params
    params.require(:text)
    params.permit(:text)
  end

  def build_prompt(text)
    <<~PROMPT
      请解释以下英语短语的意思、用法和语境：

      "#{text}"

      请直接输出HTML格式内容，包含以下结构：
      1. <h4>简短的中文解释（5-10个汉字）</h4>
      2. <p>详细解释（包含含义、用法、固定搭配、语境等）</p>
      3. <h5>例句</h5>
      4. <div class="bg-base-200 p-4 rounded-lg"><div class="text-sm text-primary mb-2">英文例句</div><div class="text-sm text-base-content/70">中文翻译</div></div>
      5. <p>使用注意事项或额外说明（可选）</p>

      请确保输出完整的HTML内容，不要包含Markdown语法标记。
    PROMPT
  end
end
