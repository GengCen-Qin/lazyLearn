class VerificationMailer < ApplicationMailer
  def verification_code
    @email = params[:email]
    @code = params[:code]
    @expires_at = VerificationCodeService::EXPIRATION_TIME.from_now

    # 渲染 HTML 模板
    html_content = render_to_string(template: "verification_mailer/verification_code")

    # 调用 SendCloud HTTP API
    send_via_sendcloud(
      to: @email,
      subject: "【LazyLearn】验证您的邮箱地址",
      html: html_content
    )
  end

  private

  def send_via_sendcloud(to:, subject:, html:)
    # SendCloud API 配置
    api_url = "https://api2.sendcloud.net/api/mail/send"

    # 构建请求参数
    params = {
      "apiUser" => ENV["SEND_CLOUD_SMTP_USERNAME"],
      "apiKey" => ENV["SEND_CLOUD_SMTP_PASSWORD"],
      "to" => to,
      "from" => ENV["EMAIL_FROM"],
      "fromName" => ENV["EMAIL_FROM_NAME"] || "LazyLearn",
      "subject" => subject,
      "html" => html,
      "respEmailId" => "true"
    }

    # 发送 HTTP POST 请求
    uri = URI(api_url)
    response = Net::HTTP.post_form(uri, params)

    # 记录响应
    result = JSON.parse(response.body)

    if result["result"]
      Rails.logger.info("SendCloud 发送成功: #{result}")
    else
      Rails.logger.error("SendCloud 发送失败: #{result['message']}")
      raise "SendCloud API 错误: #{result['message']}"
    end
  end
end
