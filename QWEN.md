# Qwen Code Context for Lazy English Project

## Project Overview

This is a Ruby on Rails 8.0.4 application called "Lazy English" that serves as a video player with synchronized subtitle support. The project is designed for language learning, specifically for "lazy English" practice, allowing users to upload video files and automatically generate transcriptions using Whisper for an interactive video player experience.

## Architecture & Technologies

- **Framework**: Ruby on Rails 8.0.4
- **Ruby Version**: 3.4.6
- **Database**: SQLite3 (development), PostgreSQL (production)
- **Frontend**: Stimulus.js for interactivity, TailwindCSS for styling, Video.js for video player
- **Asset Pipeline**: Propshaft, Importmap for JavaScript
- **Deployment**: Docker container with Kamal deployment support
- **Additional Services**: Solid Cache, Solid Queue, Solid Cable for caching, job queues, and Action Cable
- **Transcription**: Whisper-based transcription service for automatic subtitle generation
- **Performance Monitoring**: Rails Pulse for performance monitoring

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
- User authentication system with sessions
- Dark mode support
- Responsive design for desktop and mobile devices
- PWA (Progressive Web App) support

## File Structure

```
app/
├── assets/          # Stylesheets and other assets
├── controllers/     # Rails controllers
│   ├── application_controller.rb
│   ├── sessions_controller.rb
│   ├── registrations_controller.rb
│   ├── passwords_controller.rb
│   ├── email_verifications_controller.rb
│   ├── welcome_controller.rb
│   ├── videos_controller.rb
│   ├── video_player_controller.rb
│   └── word_lookup_controller.rb
├── helpers/         # Rails helpers
├── javascript/      # JavaScript and Stimulus controllers
│   ├── controllers/
│   │   ├── application.js
│   │   ├── dark_mode_controller.js
│   │   ├── email_verification_controller.js
│   │   ├── favorite_controller.js
│   │   ├── index.js
│   │   ├── mobile_menu_controller.js
│   │   ├── utils.js
│   │   ├── video_controls.js
│   │   ├── word_card_controller.js
│   │   ├── word_lookup_controller.js
│   │   ├── xiaohongshu_downloader_controller.js
│   │   └── video/
│   │       ├── play_info_controller.js
│   │       ├── player_controller.js
│   │       ├── read_mode_controller.js
│   │       └── subtitle_controller.js
├── jobs/            # Background jobs
│   ├── application_job.rb
│   ├── cos_upload_job.rb
│   ├── local_upload_job.rb
│   └── transcription_job.rb
├── mailers/         # Mailer classes
├── models/          # Rails models
│   ├── application_record.rb
│   ├── current.rb
│   ├── ecdict_word.rb
│   ├── email_verification.rb
│   ├── favorite.rb
│   ├── guest_user.rb
│   ├── session.rb
│   ├── upload.rb
│   ├── usage_limit.rb
│   ├── usage_record.rb
│   ├── user_quota.rb
│   ├── user_video.rb
│   ├── user.rb
│   ├── video.rb
│   └── authentication.rb
├── services/        # Service classes
│   ├── authentication/
│   ├── downloader/
│   ├── transcription_service.rb
│   ├── util.rb
│   ├── video_link_cache.rb
│   ├── whisper_transcription_service.rb
│   └── word_lookup_service.rb
├── views/
│   ├── components/  # Shared components
│   ├── layouts/
│   ├── pwa/
│   ├── sessions/
│   ├── videos/ (index.html.erb, show.html.erb, read_mode.html.erb)
│   └── welcome/ (index.html.erb)
```

## Main Components

### Video Model (`app/models/video.rb`)
Handles video storage, transcription status management, and file association using Active Storage. It includes methods for triggering transcription asynchronously or synchronously, and supports both local and cloud (OSS) storage.

### Videos Controller (`app/controllers/videos_controller.rb`)
Manages video resources including listing, showing details, and deletion functionality. Implements access control for free vs. paid videos.

### Video Player Controller (`app/controllers/video_player_controller.rb`)
Manages the video player interface, including displaying videos, handling transcription status queries, and providing video data to the frontend.

### Video Player Stimulus Controller (`app/javascript/controllers/video/player_controller.js`)
Handles video playback functionality using Video.js, including keyboard shortcuts, time synchronization, and event handling.

### Subtitle Stimulus Controller (`app/javascript/controllers/video/subtitle_controller.js`)
Handles all the interactive subtitle functionality:
- Parsing and displaying subtitle segments
- Synchronization with video playback
- Keyboard shortcuts for navigation
- Time synchronization between video and subtitles
- UI updates (current time, subtitle count, active subtitle highlighting)
- Clickable subtitle items for jumping to specific timestamps

### Transcription Service (`app/services/transcription_service.rb`)
Handles the automated transcription process using Whisper or Tencent ASR, converting video files to time-synchronized text segments.

### Background Jobs
- `TranscriptionJob`: Processes video transcription asynchronously
- `CosUploadJob`: Uploads videos to cloud storage
- `LocalUploadJob`: Handles local storage in development

### Routes
- `root` - Welcome page with Xiaohongshu downloader
- `/videos` - Video list page
- `/videos/:id` - Video player interface with synchronized subtitles
- `/videos/:id/read_mode` - Read mode for focused study
- `/word_lookup` - API endpoint for word lookup functionality
- `/jobs` - Mission Control for job monitoring
- `/rails_pulse` - Performance monitoring dashboard
- `/up` - Health check endpoint

## Development Setup

### Prerequisites
- Ruby 3.4.6
- Node.js
- SQLite3

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
- Multiple database support (SQLite for development, PostgreSQL for production)
- Kamal deployment support for containerized deployment
- Cloud storage integration (OSS) for video files

## Development Conventions

- Uses Rails default file structure and conventions
- Stimulus.js for JavaScript interactivity following Rails conventions
- Tailwind CSS for styling
- Importmap for JavaScript modules (no Webpack or similar)
- Standard Rails development patterns throughout
- Service objects for business logic like transcription processing
- Background job processing for long-running tasks like video transcription
- Modern authentication system with sessions
- RESTful routing patterns
- Strong parameters for controller security

## Key Configuration Files

- `Gemfile` - Ruby dependencies
- `Dockerfile` - Production container configuration  
- `Procfile.dev` - Development process configuration
- `config/database.yml` - Database configuration
- `config/routes.rb` - Application routes
- `db/schema.rb` - Database schema definition

## 重点说明

- 交互时使用中文
- 前端使用rails默认前端方案：HOTWIRE， Js 通用使用 stimulus 编写
- 后端按照rails规范编写，清晰，易懂，可维护的代码
- css使用tailwind，样式优先写入到标签中
- 不要编写测试文件
- 如果不知道某个库的代码怎么写，使用context7 mcp