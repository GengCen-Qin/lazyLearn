# Qwen Code Context for Lazy English Project

## Project Overview

This is a Ruby on Rails 8.0.4 application called "new_web" that serves as a video player with synchronized subtitle support. The project is designed for language learning, specifically for "lazy English" practice, allowing users to upload video files and corresponding JSON subtitle files to create an interactive video player experience.

## Architecture & Technologies

- **Framework**: Ruby on Rails 8.0.4
- **Ruby Version**: 3.4.6
- **Database**: SQLite3
- **Frontend**: Stimulus.js for interactivity, TailwindCSS for styling, Plyr for video player
- **Asset Pipeline**: Propshaft, Importmap for JavaScript
- **Deployment**: Docker container with Kamal deployment support
- **Additional Services**: Solid Cache, Solid Queue, Solid Cable for caching, job queues, and Action Cable

## Key Features

The main feature is a video player application with subtitle synchronization:
- Users can upload video files (MP4, MOV, WebM, OGG, AVI, MKV, M4V)
- Users can upload JSON subtitle files
- Real-time synchronization between video playback and subtitle display
- Keyboard shortcuts (Space for play/pause, Arrow keys for navigation)
- Auto-scrolling to current subtitle
- Clickable subtitle items to jump to specific timestamps

## File Structure

```
app/
├── assets/          # Stylesheets and other assets
├── controllers/     # Rails controllers
│   └── video_player_controller.rb
├── helpers/         # Rails helpers
├── javascript/      # JavaScript and Stimulus controllers
│   └── controllers/
│       └── video_subtitle_merged_controller.js
├── jobs/            # Background jobs
├── mailers/         # Mailer classes
├── models/          # Rails models
├── views/
│   └── video_player/
│       └── index.html.erb
```

## Main Components

### Video Player Controller (`video_player_controller.rb`)
Simple controller that renders the video player interface.

### Video Subtitle Stimulus Controller (`video_subtitle_merged_controller.js`)
Handles all the interactive functionality:
- Video file loading and playback
- Subtitle file parsing and synchronization
- Keyboard shortcuts
- Time synchronization between video and subtitles
- UI updates (current time, subtitle count, active subtitle highlighting)

### Routes
- `/video_player` - Main video player interface
- `/uploads` - Resource for file uploads
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
- Multiple SQLite databases for primary, cache, queue, and cable functions

## Development Conventions

- Uses Rails default file structure and conventions
- Stimulus.js for JavaScript interactivity following Rails conventions
- Tailwind CSS for styling
- Importmap for JavaScript modules (no Webpack or similar)
- Standard Rails development patterns throughout

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