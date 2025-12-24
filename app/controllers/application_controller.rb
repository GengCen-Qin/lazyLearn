class ApplicationController < ActionController::Base
  include Authentication
  include Pagy::Method

  # Skip authentication for health checks and mounted engines
  skip_before_action :require_authentication, if: :should_skip_authentication?

  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern

  private

  def should_skip_authentication?
    request.path.start_with?("/jobs") ||
    request.path.start_with?("/rails_pulse") ||
    request.path.start_with?("/up")
  end
end
