# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Ruby on Rails 8.0.4 application called "new_web" that provides video download and transcription services for Xiaohongshu (Little Red Book) videos. The application includes video management, automated transcription processing, and a dictionary feature for English learning.

## Key Features

- **Video Download**: Downloads Xiaohongshu videos using the XiaohongshuApiService
- **Video Management**: Stores videos with metadata and transcription status
- **Automated Transcription**: Processes videos through external transcription service (localhost:8000)
- **Dictionary Integration**: Includes ECDICT word database for English learning
- **Job Queue System**: Uses Solid Queue for background transcription processing
- **Docker Support**: Production-ready Docker configuration with Kamal deployment

## Common Development Commands

### Rails Commands
```bash
# Start development server
./bin/rails server

# Database operations
./bin/rails db:migrate
./bin/rails db:schema:load
./bin/rails db:seed

# Console
./bin/rails console

# Routes
./bin/rails routes
```

### Testing
```bash
# Run tests
./bin/rails test

# Run system tests
./bin/rails test:system
```

### Asset Management
```bash
# Precompile assets (production)
./bin/rails assets:precompile

# Clean assets
./bin/rails assets:clean
```

### Job Queue Management
```bash
# Start Solid Queue workers
./bin/rails solid_queue:start

# View job status via Mission Control
# Access at http://localhost:3000/jobs
```

### Code Quality
```bash
# Run Brakeman security scan
./bin/brakeman

# Run RuboCop
./bin/rubocop

# Auto-correct RuboCop offenses
./bin/rubocop -a
```

## Architecture

### Core Models

**Video** (`app/models/video.rb`)
- Central model for video management
- Has attached video files via Active Storage
- Tracks transcription status (pending, processing, completed, failed)
- Stores transcription segments as JSON
- Supports multiple languages (zh, en, ja, ko, es, fr, de)

**Upload** (`app/models/upload.rb`)
- Simple model for file uploads
- Has attached files via Active Storage

**EcdictWord** (`app/models/ecdict_word.rb`)
- Dictionary model for English words
- Contains word definitions, phonetics, translations
- Indexed for efficient word lookup

### Key Services

**TranscriptionService** (`app/services/transcription_service.rb`)
- Handles video transcription via external API at localhost:8000
- Processes video files and stores transcription segments
- Updates video transcription status

**XiaohongshuApiService** (`app/services/xiaohongshu_api_service.rb`)
- Extracts content information from Xiaohongshu share URLs
- Provides download URLs and metadata

**XiaohongshuVideoDownloader** (`app/services/xiaohongshu_video_downloader.rb`)
- Downloads videos from Xiaohongshu URLs
- Saves videos to database with proper metadata
- Handles file validation and content type detection

**VideoLinkCache** (`app/services/video_link_cache.rb`)
- Caches video links to avoid duplicate downloads
- Improves performance and reduces API calls

### Background Jobs

**TranscriptionJob** (`app/jobs/transcription_job.rb`)
- Processes video transcription asynchronously
- Uses Solid Queue with retry logic
- Handles transcription service failures gracefully

### Controllers

**VideosController** (`app/controllers/videos_controller.rb`)
- RESTful controller for video management
- CRUD operations (index, show, destroy)

**WelcomeController** (`app/controllers/welcome_controller.rb`)
- Main page controller
- Handles Xiaohongshu video download requests
- Integrates with caching and API services

**VideoPlayerController** (`app/controllers/video_player_controller.rb`)
- Manages video playback interface
- Handles video streaming and subtitle display

## External Dependencies

### Transcription Service
- External transcription API running on localhost:8000
- Expects file path and language parameters
- Returns segmented transcription data with timestamps

### File Storage
- Uses Active Storage with local disk storage
- Supports various video formats (mp4, mov, avi, mkv, webm, etc.)
- Configurable for cloud storage in production

## Database Schema

Key tables:
- `videos` - Video metadata and transcription data
- `uploads` - File upload management
- `ecdict_words` - English dictionary with 107,363 words
- `active_storage_*` - File storage management
- `solid_queue_*` - Background job processing

## Development Notes

### Language Support
The application supports multiple transcription languages:
- Chinese (zh) - default
- English (en)
- Japanese (ja)
- Korean (ko)
- Spanish (es)
- French (fr)
- German (de)

### Video Processing Flow
1. User submits Xiaohongshu URL
2. System checks cache for existing video
3. Extracts video info via XiaohongshuApiService
4. Downloads video using XiaohongshuVideoDownloader
5. Creates Video record and attaches file
6. Triggers async TranscriptionJob
7. TranscriptionService processes video via external API
8. Updates video with transcription segments

### Caching Strategy
- VideoLinkCache prevents duplicate downloads
- Database indexes on transcription status and language
- Solid Queue for efficient job processing

## Deployment

### Docker Configuration
- Multi-stage Dockerfile for production optimization
- Runs as non-root user for security
- Uses Thruster for performance acceleration
- Exposes port 80

### Kamal Deployment
- Configured for Kamal deployment tool
- Production-ready with proper health checks
- Environment variables and secrets management

## Security Considerations

- Input validation for Xiaohongshu URLs
- File type restrictions for video uploads
- SQL injection protection via ActiveRecord
- XSS protection via Rails built-in features
- Regular security scans via Brakeman

## Performance Optimization

- Background job processing for transcription
- Database indexing on frequently queried fields
- File caching to avoid duplicate downloads
- Asset precompilation for production
- Thruster for HTTP request acceleration