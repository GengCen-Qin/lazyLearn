Rails.application.routes.draw do
  resource :session, except: [:show, :edit, :update]
  resources :registrations, only: [ :new, :create ]
  resources :passwords, param: :token
  get "up" => "rails/health#show", as: :rails_health_check

  root "welcome#index"

  post "xhs_parse" => "xhs_parse#create"

  resources :videos, only: [ :index, :show, :destroy ]
  post "word_lookup", to: "word_lookup#create"

  mount MissionControl::Jobs::Engine, at: "/jobs"
  mount RailsPulse::Engine => "/rails_pulse"

  # Render dynamic PWA files from app/views/pwa/* (remember to link manifest in application.html.erb)
  get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
  get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker
end
