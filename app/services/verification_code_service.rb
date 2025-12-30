class VerificationCodeService
  CODE_LENGTH = 6
  EXPIRATION_TIME = 10.minutes
  RATE_LIMIT_EMAIL = 60.seconds
  RATE_LIMIT_IP = 10.minutes
  MAX_ATTEMPTS = 5
  MAX_IP_REQUESTS = 5

  class RateLimitError < StandardError; end
  class ValidationError < StandardError; end

  # 发送验证码
  def self.send_code(email, ip_address)
    email = email.to_s.strip.downcase

    # 验证邮箱格式
    validate_email_format!(email)

    # 检查频率限制
    check_rate_limits!(email, ip_address)

    # 生成并保存验证码
    code = generate_code
    verification = create_verification(email, code, ip_address)

    # 发送邮件
    deliver_verification_email(email, code)

    Rails.logger.info "验证码已发送至: #{email}, #{code}, 过期时间: #{verification.expires_at}"

    {
      success: true,
      message: "验证码已发送,请查收邮件",
      expires_in: EXPIRATION_TIME
    }
  end

  # 验证验证码
  def self.verify(email, code)
    email = email.to_s.strip.downcase
    code = code.to_s.strip

    # 查找有效的验证码记录
    verification = EmailVerification.active.for_email(email).first

    return { success: false, error: "验证码不存在或已过期" } unless verification

    # 验证码错误
    unless correct_code?(verification, code)
      verification.increment_attempts!
      remaining_attempts = MAX_ATTEMPTS - verification.attempts_count
      return {
        success: false,
        error: "验证码错误",
        remaining_attempts: remaining_attempts
      }
    end

    { success: true, message: "验证成功" }
  end

  private

  def self.validate_email_format!(email)
    unless email.match?(URI::MailTo::EMAIL_REGEXP)
      raise ValidationError, "邮箱格式不正确"
    end
  end

  def self.check_rate_limits!(email, ip_address)
    # 检查邮箱频率限制
    recent_email = EmailVerification.for_email(email)
                                .recent(RATE_LIMIT_EMAIL / 60)
                                .active

    if recent_email.exists?
      raise RateLimitError, "请等待#{RATE_LIMIT_EMAIL.to_i / 60}秒后再试"
    end

    # 检查IP频率限制
    recent_ip = EmailVerification.where(ip_address: ip_address)
                                .recent(RATE_LIMIT_IP / 60)

    if recent_ip.count >= MAX_IP_REQUESTS
      raise RateLimitError, "您的操作过于频繁,请稍后再试"
    end
  end

  def self.generate_code
    SecureRandom.random_number(10**CODE_LENGTH).to_s.rjust(CODE_LENGTH, '0')
  end

  def self.create_verification(email, code, ip_address)
    EmailVerification.create!(
      email: email,
      code_digest: bcrypt(code),
      expires_at: EXPIRATION_TIME.from_now,
      ip_address: ip_address
    )
  end

  def self.bcrypt(code)
    BCrypt::Password.create(code)
  end

  def self.correct_code?(verification, code)
    BCrypt::Password.new(verification.code_digest) == code
  end

  def self.deliver_verification_email(email, code)
    VerificationMailer.new(email: email, code: code).verification_code
  end
end
