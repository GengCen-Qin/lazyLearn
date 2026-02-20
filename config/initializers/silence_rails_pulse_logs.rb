Rails.application.config.to_prepare do
  if Rails.env.development? && defined?(RailsPulse)
    RailsPulse::Operation.logger.level = Logger::WARN   # 完全静音
    # 或降级
    # RailsPulse::Operation.logger.level = Logger::WARN

    # # 可选：其他模型也一起处理
    RailsPulse::Request.logger.level = Logger::WARN
    RailsPulse::Query.logger.level = Logger::WARN
    # # RailsPulse::JobRun.logger   = Logger.new(nil)
  end
end