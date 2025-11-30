# Qwen Code Context for Lazy English Project

## Project Overview

This is a Ruby on Rails 8.0.4 application called "new_web" that serves as a video player with synchronized subtitle support. The project is designed for language learning, specifically for "lazy English" practice, allowing users to upload video files and automatically generate transcriptions using Whisper for an interactive video player experience.

## Architecture & Technologies

- **Framework**: Ruby on Rails 8.0.4
- **Ruby Version**: 3.4.6
- **Database**: SQLite3
- **Frontend**: Stimulus.js for interactivity, TailwindCSS for styling, Plyr for video player
- **Asset Pipeline**: Propshaft, Importmap for JavaScript
- **Deployment**: Docker container with Kamal deployment support
- **Additional Services**: Solid Cache, Solid Queue, Solid Cable for caching, job queues, and Action Cable
- **Transcription**: Whisper-based transcription service for automatic subtitle generation

## Key Features

The main feature is a video player application with automated subtitle synchronization:
- Users can upload video files (MP4, MOV, WebM, OGG, AVI, MKV, M4V)
- Automatic transcription using Whisper service to generate JSON subtitle files
- Real-time synchronization between video playback and subtitle display
- Keyboard shortcuts (Space for play/pause, Arrow keys for navigation)
- Auto-scrolling to current subtitle
- Clickable subtitle items to jump to specific timestamps
- Word lookup functionality with pop-up dictionary
- Video download capability from Xiaohongshu (Little Red Book)
- Asynchronous processing of video transcriptions using background jobs

## File Structure

```
app/
├── assets/          # Stylesheets and other assets
├── controllers/     # Rails controllers
│   ├── application_controller.rb
│   ├── uploads_controller.rb
│   ├── video_player_controller.rb
│   ├── videos_controller.rb
│   ├── welcome_controller.rb
│   └── word_lookup_controller.rb
├── helpers/         # Rails helpers
├── javascript/      # JavaScript and Stimulus controllers
│   └── controllers/
│       ├── application.js
│       ├── hello_controller.js
│       ├── index.js
│       ├── subtitle_manager.js
│       ├── utils.js
│       ├── video_controls.js
│       ├── video_subtitle_merged_controller.js
│       ├── word_lookup.js
│       └── xiaohongshu_downloader_controller.js
├── jobs/            # Background jobs
├── mailers/         # Mailer classes
├── models/          # Rails models
│   ├── application_record.rb
│   ├── ecdict_word.rb
│   ├── upload.rb
│   └── video.rb
├── services/        # Service classes
│   ├── downloader/
│   ├── transcription_service.rb
│   ├── util.rb
│   ├── video_link_cache.rb
│   ├── whisper_transcription_service.rb
│   └── word_lookup_service.rb
├── views/
│   ├── layouts/
│   ├── pwa/
│   ├── uploads/
│   ├── videos/ (index.html.erb, show.html.erb)
│   └── welcome/ (index.html.erb)
```

## Main Components

### Video Model (`app/models/video.rb`)
Handles video storage, transcription status management, and file association using Active Storage. It includes methods for triggering transcription asynchronously or synchronously.

### Video Player Controller (`app/controllers/video_player_controller.rb`)
Manages the video player interface, including displaying videos, handling transcription status queries, and providing video data to the frontend.

### Video Controller (`app/controllers/videos_controller.rb`)
Manages video resources including listing, showing details, and deletion functionality.

### Video Subtitle Stimulus Controller (`app/javascript/controllers/video_subtitle_merged_controller.js`)
Handles all the interactive functionality:
- Video file loading and playback
- Subtitle file parsing and synchronization
- Keyboard shortcuts
- Time synchronization between video and subtitles
- UI updates (current time, subtitle count, active subtitle highlighting)
- Word lookup functionality

### Transcription Service (`app/services/transcription_service.rb`)
Handles the automated transcription process using Whisper, converting video files to time-synchronized text segments.

### Routes
- `root` - Welcome page with Xiaohongshu downloader
- `/videos` - Video list page
- `/videos/:id` - Video player interface with synchronized subtitles
- `/word_lookup` - API endpoint for word lookup functionality
- `/jobs` - Mission Control for job monitoring
- `/up` - Health check endpoint

## Development Setup

### Prerequisites
- Ruby 3.4.6
- Node.js
- SQLite3
- Docker (for production builds)

### Initial Setup
1. Install dependencies: `bundle install`
2. Set up the database: `rails db:setup`
3. Start the development server: `bin/dev` (or `foreman start -f Procfile.dev`)

### Running the Application
- Development: `bin/dev` (starts Rails server and Tailwind watcher)
- Alternative: `rails server` and `rails tailwindcss:watch` in separate terminals

### Testing
- Run tests: `rails test`

## Production Deployment

The application is configured for Docker deployment:
- Docker image builds with all assets precompiled
- Uses Thruster web server in production
- Multiple SQLite databases for primary, cache, queue, and cable functions
- Kamal deployment support for containerized deployment

## Development Conventions

- Uses Rails default file structure and conventions
- Stimulus.js for JavaScript interactivity following Rails conventions
- Tailwind CSS for styling
- Importmap for JavaScript modules (no Webpack or similar)
- Standard Rails development patterns throughout
- Service objects for business logic like transcription processing
- Background job processing for long-running tasks like video transcription

## Key Configuration Files

- `Gemfile` - Ruby dependencies
- `Dockerfile` - Production container configuration  
- `Procfile.dev` - Development process configuration
- `config/database.yml` - Database configuration
- `config/routes.rb` - Application routes

## 重点说明

- 交互时使用中文
- 前端使用rails默认前端方案：HOTWIRE， Js 通用使用 stimulus 编写
- 后端按照rails规范编写，清晰，易懂，可维护的代码
- css使用tailwind，样式优先写入到标签中
- 不要编写测试文件
- 如果不知道某个库的代码怎么写，使用context7 mcp