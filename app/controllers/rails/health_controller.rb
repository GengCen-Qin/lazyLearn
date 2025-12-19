class Rails::HealthController < ApplicationController
  allow_unauthenticated_access only: [ :show ]
  def show
    render plain: "OK", status: :ok
  end
end
