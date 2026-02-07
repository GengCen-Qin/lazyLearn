Rails.application.routes.draw do
  resources :notes
  resource :session, except: [ :show, :edit, :update ]
  resources :registrations, only: [ :new, :create ]
  resources :passwords, param: :token
  resources :email_verifications, only: [ :create ]

  get "up" => "rails/health#show", as: :rails_health_check

  root "welcome#index"

  post "xhs_parse" => "xhs_parse#create"
  post "bilibili_parse" => "bilibili_parse#create"

  # 统一的下载解析接口
  resources :downloads, only: [ :create ]

  resources :videos, only: [ :index, :show, :destroy ] do
    member do
      get :read_mode
    end
  end

  resources :audios, only: [ :index, :show, :destroy ] do
    member do
      get :read_mode
    end
  end

  post "word_lookup", to: "word_lookup#create"
  post "phrase_explain", to: "phrase_explains#create"

  resources :favorites, only: [ :index, :create, :destroy ] do
    collection do
      get :check
    end
  end

  mount MissionControl::Jobs::Engine, at: "/jobs"
  mount RailsPulse::Engine => "/rails_pulse"

  # Render dynamic PWA files from app/views/pwa/* (remember to link manifest in application.html.erb)
  get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
  get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker
end
