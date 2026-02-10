module OpenAiClient
  def self.client
    @client ||= OpenAI::Client.new(
      access_token: ENV.fetch('AI_KEY'),
      uri_base: 'https://api.deepseek.com/v1'
    )
  end

  def self.chat(prompt)
    response = client.chat(
      parameters: {
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }
    )
    response.dig("choices", 0, "message", "content")
  end

  def self.chat_stream(prompt)
    response = client.chat(parameters: {
      model: 'deepseek-chat',
      messages: [
        { "role": "system", content: "你是一个专业的英语学习助手，专门帮助用户理解英语短语和表达。" },
        { role: "user", content: prompt }
      ],
      stream: proc do |chunk, _bytesize|
        content = chunk.dig("choices", 0, "delta", "content")
        yield content if content
      end
    })
  end
end
