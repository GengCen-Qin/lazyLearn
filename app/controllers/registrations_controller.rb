class RegistrationsController < ApplicationController
  allow_unauthenticated_access only: [ :new, :create ]
  rate_limit to: 20, within: 10.minutes, only: :create, with: -> { redirect_to new_registration_url, alert: "请稍后重试." }

  def new
    @user = User.new
  end

  def create
    # 验证邮箱验证码
    verification_result = VerificationCodeService.verify(
      params[:user][:email_address],
      params[:user][:verification_code]
    )

    unless verification_result[:success]
      @user = User.new(user_params)
      flash.now[:alert] = verification_result[:error]
      render :new, status: :unprocessable_entity
      return
    end

    @user = User.new(user_params)

    if @user.save
      redirect_to new_session_path, notice: "注册成功，请登录"
    else
      render :new, status: :unprocessable_entity
    end
  end

  private
    def user_params
      params.require(:user).permit(:email_address, :password, :password_confirmation)
    end
end
