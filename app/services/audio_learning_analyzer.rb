# AI 音频学习材料分析服务
#
# @example
#   analyzer = AudioLearningAnalyzer.new(audio)
#   result = analyzer.analyze
class AudioLearningAnalyzer
  def initialize(audio)
    @audio = audio
  end

  # 执行分析
  # @return [Hash] AI 返回的解析结果
  def analyze
    segments_for_analysis = prepare_segments
    prompt = build_prompt(segments_for_analysis)
    parse_response(OpenAiClient.chat(prompt))
  end

  private

  # 准备用于分析的字幕片段
  def prepare_segments
    segments = @audio.transcription_segments || []
    # 限制分析范围，避免 token 过多
    segments.map do |seg|
      {
        text: seg["text"]
      }
    end
  end

  # 构建 AI Prompt
  def build_prompt(segments)
    <<~PROMPT
      你是一个专业的英语教学专家。请分析以下播客字幕，提取学习材料。

      ## 任务要求

      1. **识别核心对话（Core Dialogue）**
         - 主持人通常会说 "let's listen to the dialogue"、"here's the conversation" 等提示
         - 对话通常包含 2 个或更多角色的交流
         - 找到对话的开始和结束位置

      2. **提取对话信息**
         - 场景描述：用一句话概括（谁在什么情况下和谁说话）
         - 对话原文：按顺序记录每句台词

      3. **提取关键表达**
         - 从对话中提取 3-5 个实用表达
         - 从主持人讲解中提取他们推荐的表达

      4. **生成练习片段**
         - 包含核心对话的每一句
         - 包含主持人推荐的关键句
         - 为每个片段提供中文提示

      ## 字幕内容

      #{segments.map { |s| "[#{s[:time_str]}] #{s[:text]}" }.join("\n")}

      ## 返回格式（必须严格遵守）

      请返回**纯 JSON 格式**，不要包含任何 Markdown 标记或其他文字。格式如下：

      {
        "core_dialogue": {
          "title": "对话标题（简短，如"请求延期"、"咖啡店点餐"）",
          "scenario": "场景描述（中文，1-2 句话说明谁在什么情况下和谁说话）",
          "segments": [
            {
              "role": "角色名（如 Boss/Customer/Student 等）",
              "text": "台词原文（英文）",
              "start": 开始时间（数字，单位：秒）,
              "end": 结束时间（数字，单位：秒）
            }
          ]
        },
        "key_expressions": [
          {
            "expression": "表达原文（英文）",
            "meaning": "中文释义",
            "note": "用法说明（中文，说明使用场景、语气等）"
          }
        ],
        "practice_segments": [
          {
            "type": "dialogue",
            "role": "角色名",
            "text": "台词原文（英文）",
            "cn_hint": "中文提示（这句话的中文意思）",
            "start": 开始时间（数字，单位：秒）
          }
        ]
      }

      ## 注意事项

      - 必须返回有效的 JSON
      - 不要添加 ```json 或 ``` 等 Markdown 标记
      - 如果无法识别核心对话，返回：{"error": "未找到核心对话"}
      - 场景描述用中文，对话和表达用英文
      - practice_segments 需要包含核心对话的所有句子 + 主持人推荐的关键句
    PROMPT
  end

  # 解析 AI 响应
  def parse_response(content)
    # 清理可能的 Markdown 标记
    content = content.gsub(/```json\s*/, "").gsub(/```\s*/, "").strip if content

    JSON.parse(content)
  rescue JSON::ParserError => e
    Rails.logger.error "AI 响应解析失败：#{e.message}, 原始响应：#{content}"
    raise "AI 返回格式错误：#{e.message}"
  end
end
