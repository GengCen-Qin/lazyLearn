class PhraseExplainService
  include HTTParty

  BASE_URL = "https://api.deepseek.com/chat/completions".freeze

  attr_reader :text

  def initialize(text)
    @text = text
  end

  def call
    return failure_result("文本不能为空") if text.blank?

    # 调用AI API获取解释
    ai_explanation = fetch_ai_explanation(text)

    if ai_explanation
      success_result(ai_explanation)
    else
      failure_result("无法获取解释，请稍后再试")
    end
  rescue => error
    Rails.logger.error("Phrase explain service error: #{error.message}")
    Rails.logger.error(error.backtrace.join("\n"))
    failure_result("服务暂时不可用")
  end

  private

  # 调用AI API获取短语解释
  def fetch_ai_explanation(text)
    return nil if Rails.env.test? # 测试环境中不调用API

    begin
      api_key = ENV["AI_KEY"]
      return nil unless api_key

      # 构建提示词
      prompt = build_prompt(text)

      response = HTTParty.post(
        "#{BASE_URL}",
        headers: {
          "Authorization" => "Bearer #{api_key}",
          "Content-Type" => "application/json"
        },
        body: {
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: "你是一个专业的英语学习助手，专门帮助用户理解英语短语和表达。请提供准确、清晰、易懂的解释。"
            },
            {
              role: "user",
              content: prompt
            }
          ],
          stream: false,
          max_tokens: 500,
          temperature: 0.7
        }.to_json,
        timeout: 30
      )

      if response.success?
        response_data = JSON.parse(response.body)
        explanation_text = response_data.dig("choices", 0, "message", "content")

        if explanation_text
          parse_ai_response(explanation_text)
        else
          nil
        end
      else
        Rails.logger.error("AI API error: #{response.code} - #{response.body}")
        nil
      end
    rescue => error
      Rails.logger.error("AI API request failed: #{error.message}")
      nil
    end
  end

  # 构建AI提示词
  def build_prompt(text)
    <<~PROMPT
      请解释以下英语短语的意思、里面使用的固定搭配，用法和语境：

      "#{text}"

      请按以下JSON格式回答：
      {
        "title": "短语的简短解释（5-10个汉字）",
        "content": "详细解释（包含含义、用法、固定搭配、语境等，100-200汉字）",
        "examples": [
          {
            "english": "英文例句1",
            "chinese": "中文翻译1"
          },
          {
            "english": "英文例句2",
            "chinese": "中文翻译2"
          }
        ],
        "usage": "使用注意事项或额外说明（可选）"
      }

      请确保回答准确、易懂，适合英语学习者理解。
    PROMPT
  end

  # 解析AI响应
  def parse_ai_response(response_text)
    begin
      # 尝试解析JSON
      json_match = response_text.match(/\{[\s\S]*\}/)
      if json_match
        json_str = json_match[0]
        data = JSON.parse(json_str)

        {
          title: data["title"] || "短语解释",
          content: data["content"] || response_text,
          examples: data["examples"] || [],
          usage: data["usage"]
        }
      else
        # 如果无法解析JSON，返回默认格式
        {
          title: "短语解释",
          content: response_text,
          examples: [],
          usage: nil
        }
      end
    rescue JSON::ParserError => e
      Rails.logger.error("Failed to parse AI response as JSON: #{e.message}")
      # 如果JSON解析失败，返回默认格式
      {
        title: "短语解释",
        content: response_text,
        examples: [],
        usage: nil
      }
    end
  end

  def success_result(explanation)
    {
      success: true,
      explanation: explanation
    }
  end

  def failure_result(message)
    {
      success: false,
      error: message
    }
  end
end
