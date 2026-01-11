class WelcomeController < ApplicationController
  allow_unauthenticated_access
  try_user

  def index
  end
end
