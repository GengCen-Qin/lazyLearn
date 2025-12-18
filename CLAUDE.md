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

### Development Setup
```bash
# Initial setup (installs dependencies, prepares database, starts server)
./bin/setup

# Start development server with CSS hot-reload
./bin/dev

# Or start Rails server only
./bin/rails server
```

### Rails Commands
```bash
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

This Rails application follows several key architectural patterns:

### Service-Oriented Architecture
- Business logic encapsulated in service classes rather than models or controllers
- Clear separation between models, views, and services
- Service objects handle complex operations like transcription and word lookup

### Multi-Database Setup
- Primary PostgreSQL database for application data
- Legacy SQLite database for ECDICT dictionary
- Separate database configurations in database.yml

### State Machine Pattern
- Video transcription status follows: `pending` → `processing` → `completed`/`failed`
- Automatic state transitions with proper error handling

### Background Processing
- Solid Queue for async operations (transcription, file uploads)
- Mission Control interface for job monitoring at /jobs

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
- Legacy model connecting to SQLite dictionary database
- Contains 107,363 English words with definitions, phonetics, translations
- Abstract class that connects to `stardict` table via legacy connection
- Provides efficient word lookup with multiple search strategies
- Includes scopes for core vocabulary, CET4/CET6 words

### Key Services

**TranscriptionService** (`app/services/transcription_service.rb`)
- Orchestrates video transcription process
- Supports multiple transcription tools: Tencent ASR and OpenAI Whisper
- Handles different transcription workflows
- Updates video with transcription results

**WordLookupService** (`app/services/word_lookup_service.rb`)
- Service object pattern for word lookup
- Returns structured success/failure results
- Integrates with EcdictWord model

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

**CosUploadJob** (`app/jobs/cos_upload_job.rb`)
- Handles cloud storage uploads (production)
- Uploads files to Tencent COS

**LocalUploadJob** (`app/jobs/local_upload_job.rb`)
- Handles local file uploads (development)
- Manages file storage operations

### Controllers

**WelcomeController** (`app/controllers/welcome_controller.rb`)
- Main landing page controller
- Handles Xiaohongshu video download requests
- Integrates with caching and API services

**VideosController** (`app/controllers/videos_controller.rb`)
- RESTful controller for video management
- CRUD operations (index, show, destroy)

**VideoPlayerController** (`app/controllers/video_player_controller.rb`)
- Manages video playback interface
- Handles video streaming and subtitle display

**WordLookupController** (`app/controllers/word_lookup_controller.rb`)
- API endpoint for word lookup
- Returns JSON responses for English words

**XhsParseController** (`app/controllers/xhs_parse_controller.rb`)
- Handles Xiaohongshu URL parsing
- Extracts video metadata from share URLs

## External Dependencies

### Transcription Services
- Supports multiple transcription engines:
  - Tencent ASR service
  - OpenAI Whisper (localhost:8000)
- Expects file path and language parameters
- Returns segmented transcription data with timestamps

### Dictionary Database
- ECDICT SQLite database (107,363 English words)
- Setup script: `./setup_stardict.sh`
- Automatically downloads and installs in storage/stardict.db

### File Storage
- Uses Active Storage with local disk storage
- Supports various video formats (mp4, mov, avi, mkv, webm, etc.)
- Cloud storage via Tencent COS in production

## Database Schema

### Primary Database (PostgreSQL)
Key tables:
- `videos` - Video metadata and transcription data
- `uploads` - File upload management
- `users`, `sessions` - Authentication
- `active_storage_*` - File storage management
- `solid_queue_*` - Background job processing

### Legacy Database (SQLite)
- `stardict` table - ECDICT English dictionary (107,363 words)
- Connected via separate `legacy` configuration in database.yml

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