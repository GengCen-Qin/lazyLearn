class EmailVerificationsController < ApplicationController
  allow_unauthenticated_access

  def create
    result = VerificationCodeService.send_code(
      params[:email],
      request.remote_ip
    )

    render json: result
  rescue VerificationCodeService::ValidationError => e
    render json: { success: false, error: e.message }, status: :unprocessable_entity
  rescue VerificationCodeService::RateLimitError => e
    render json: { success: false, error: e.message }, status: :too_many_requests
  rescue => e
    Rails.logger.error "验证码发送失败: #{e.message}"
    Rails.logger.error e.backtrace.join("\n")
    render json: { success: false, error: "发送失败,请稍后重试" }, status: :internal_server_error
  end
end
