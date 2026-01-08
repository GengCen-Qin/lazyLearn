# Pin npm packages by running ./bin/importmap

pin "application"
pin "@hotwired/turbo-rails", to: "turbo.min.js"
pin "@hotwired/stimulus", to: "stimulus.min.js"
pin "@hotwired/stimulus-loading", to: "stimulus-loading.js"
pin_all_from "app/javascript/controllers", under: "controllers"
pin "xgplayer" # @3.0.23
pin "danmu.js" # @1.1.13
pin "delegate" # @3.2.0
pin "downloadjs" # @1.4.7
pin "eventemitter3" # @4.0.7
pin "xgplayer-subtitles" # @3.0.23
