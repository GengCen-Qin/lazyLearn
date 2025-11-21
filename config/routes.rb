Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  root "welcome#index"

  resources :videos, only: [:index, :show, :destroy]
  get "video_player", to: "video_player#index"
end
