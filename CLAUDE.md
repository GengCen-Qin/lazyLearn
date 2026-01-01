# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Ruby on Rails 8.0.4 application (codenamed "lazy") that provides video download and transcription services for Xiaohongshu (Little Red Book) videos. The application includes video management, automated transcription processing, and a dictionary feature for English learning. The application is deployed to production via Kamal with multi-server architecture.

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

# Start background job processors
./bin/jobs

# Setup ECDICT dictionary database
./setup_stardict.sh
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
# Run all tests (unit + system)
./bin/rails test

# Run only unit tests
./bin/rails test:test

# Run only system tests
./bin/rails test:system

# Prepare test database
./bin/rails db:test:prepare

# Run specific test file
./bin/rails test test/models/video_test.rb

# Run specific test case
./bin/rails test test/models/video_test.rb -n test_should_create_video
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

### Authentication & Session Management
- Complete user authentication system with registration, login, password reset
- Secure password storage using bcrypt and `has_secure_password`
- Session tracking with IP address logging
- Email-based password reset workflow

### Frontend Architecture (Hotwire + Stimulus)
- Modular Stimulus controllers for video player functionality:
  - `VideoControls`: Video playback controls (separate module)
  - `SubtitleManager`: Subtitle display and synchronization (separate module)
  - `WordLookup`: English word lookup integration (separate module)
  - `Utils`: Shared utility functions (separate module)
- Unified `SubtitleMergedController` coordinating all modules
- Dark mode support via `dark_mode_controller.js`
- Email verification support via `email_verification_controller.js`
- Xiaohongshu downloader integration via `xiaohongshu_downloader_controller.js`
- Importmap for JavaScript dependency management (no build step required)

### PWA Support
- Service Worker registration at `/service-worker`
- Web App Manifest at `/manifest`
- Progressive Web App capabilities for offline functionality

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

**User** (`app/models/user.rb`)
- User authentication and management
- Secure password handling with bcrypt
- Email normalization and validation
- Has many sessions with dependent destroy

**Session** (`app/models/session.rb`)
- User session management with expiration
- IP address and user agent tracking

**EmailVerification** (`app/models/email_verification.rb`)
- Email verification code management
- Code expiration and attempt tracking
- Used for user registration verification

### Key Services

**TranscriptionService** (`app/services/transcription_service.rb`)
- Orchestrates video transcription process
- Automatically uses Whisper in development, Tencent ASR in production (unless tool specified)
- Polls Tencent ASR for completion status
- Updates video with transcription results or marks as failed

**WordLookupService** (`app/services/word_lookup_service.rb`)
- Service object pattern for word lookup
- Returns structured success/failure results
- Integrates with EcdictWord model

**VerificationCodeService** (`app/services/verification_code_service.rb`)
- Generates and validates email verification codes
- Supports code expiration and attempt limits
- Used for user registration email verification

**Downloader::Xhs** (`app/services/downloader/xhs.rb`)
- Main downloader service for Xiaohongshu videos
- Delegates to XhsUrlParser for link parsing
- Extracts video title, description, and download URLs
- Handles multiple Xiaohongshu link formats

**XhsConverter** (`app/services/downloader/xhs_converter.rb`)
- Format conversion and processing

**XhsExplore** (`app/services/downloader/xhs_explore.rb`)
- Content exploration and discovery

**XhsUrlParser** (`app/services/downloader/xhs_url_parser.rb`)
- URL parsing and validation
- Handles xhslink.com short links and xiaohongshu.com URLs

**TencentAsrService** (`app/services/tencent_asr_service.rb`)
- Tencent Cloud ASR integration for production transcription
- Submits tasks and polls for results

**WhisperTranscriptionService** (`app/services/whisper_transcription_service.rb`)
- Local OpenAI Whisper transcription (development environment)
- Runs on localhost:8000

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

**Authentications Controllers** (`app/controllers/authentications/`)
- **RegistrationsController**: User registration workflow
- **SessionsController**: User login/logout management
- **PasswordsController**: Password reset functionality
- **PasswordsMailer**: Email delivery for password resets

**RegistrationsController** (`app/controllers/registrations_controller.rb`)
- User registration workflow with email verification
- Validates email uniqueness and password strength
- Triggers verification code email via SendCloud API

**SessionsController** (`app/controllers/sessions_controller.rb`)
- User login/logout management
- Creates secure sessions with IP tracking

**PasswordsController** (`app/controllers/passwords_controller.rb`)
- Password reset functionality
- Token-based password reset workflow

**EmailVerificationsController** (`app/controllers/email_verifications_controller.rb`)
- Handles email verification code submission
- Validates codes and marks verifications as used

**PasswordsMailer** (`app/mailers/passwords_mailer.rb`)
- Email delivery for password resets

**VerificationMailer** (`app/mailers/verification_mailer.rb`)
- Sends verification codes via SendCloud HTTP API
- Used for user registration email verification

**WelcomeController** (`app/controllers/welcome_controller.rb`)
- Main landing page controller
- Handles Xiaohongshu video download requests
- Integrates with caching and API services

**VideosController** (`app/controllers/videos_controller.rb`)
- RESTful controller for video management
- CRUD operations (index, show, destroy)
- Uses Pagy for pagination

**VideoPlayerController** (`app/controllers/video_player_controller.rb`)
- Manages video playback interface
- Handles video streaming and subtitle display

**WordLookupController** (`app/controllers/word_lookup_controller.rb`)
- API endpoint for word lookup
- Returns JSON responses for English words from ECDICT

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
- Development uses letter_opener gem for email preview

### Email Service
- SendCloud HTTP API for transactional emails
- Supports verification codes and password resets
- Configured via environment variables (SEND_CLOUD_SMTP_USERNAME, SEND_CLOUD_SMTP_PASSWORD, EMAIL_FROM, EMAIL_FROM_NAME)

## Database Schema

### Primary Database (Development/Test: SQLite, Production: PostgreSQL)
Key tables:
- `videos` - Video metadata and transcription data
- `uploads` - File upload management
- `users`, `sessions`, `email_verifications` - Authentication
- `active_storage_*` - File storage management
- `solid_queue_*` - Background job processing
- `rails_pulse_*` - Performance monitoring data

### Legacy Database (SQLite)
- `stardict` table - ECDICT English dictionary (107,363 words)
- Connected via separate `legacy` configuration in database.yml
- Accessed through EcdictWord abstract model

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
1. User submits Xiaohongshu URL or share text
2. System validates URL format using Downloader::Xhs
3. Extracts video info (title, description, video URL) via XhsUrlParser
4. Downloads video using Downloader::Xhs
5. Creates Video record with unique download_link (prevents duplicates)
6. Attaches video file via Active Storage
7. after_create_commit triggers:
   - LocalUploadJob (development) or CosUploadJob (production)
   - TranscriptionJob (async, via Solid Queue)
8. TranscriptionService processes video:
   - Development: WhisperTranscriptionService (localhost:8000)
   - Production: TencentAsrService (polls until completion)
9. Updates video with transcription segments or marks as failed
10. Frontend polls for status updates and displays results when complete

### Caching Strategy
- Unique index on `videos.download_link` prevents duplicate video processing
- Database indexes on transcription status and language for efficient queries
- Solid Queue for efficient background job processing
- Pagy for efficient pagination of video lists

### Authentication Flow
1. User navigates to registration page
2. Submits email and password
3. System validates email format and uniqueness
4. Creates EmailVerification record with 6-digit code (expires in configurable time)
5. Sends verification code via SendCloud API
6. User submits code from email
7. System validates code and marks EmailVerification as used
8. Creates User record
9. Creates Session with IP address and user agent
10. Sets signed cookie for session persistence

### Current Attributes Pattern
- `Current.session` - Thread-local session storage (ActiveSupport::CurrentAttributes)
- Used by Authentication concern to track authenticated user per request
- Accessible via `Current.user` delegate

## Development Tools & Quality Assurance

### Code Quality Tools
```bash
# Run security vulnerability scanner
./bin/brakeman

# Run Ruby code style checker
./bin/rubocop

# Auto-correct RuboCop style issues
./bin/rubocop -a

# Generate model annotations
./bin/rails annotate

# JavaScript dependency audit
./bin/rails importmap:audit
```

### Ruby Version
- Ruby 3.4.6 (see .ruby-version)
- Uses Chinese gem mirror (gems.ruby-china.com) for faster installs in China

### Performance Monitoring
- **Rails Pulse**: Detailed performance monitoring with configurable thresholds
- **Mission Control Jobs**: Background job monitoring at `/jobs`
- **Health Checks**: Application status endpoint at `/up`

### CI/CD Pipeline
- **GitHub Actions** workflows:
  - Ruby security scanning (Brakeman)
  - JavaScript dependency auditing (Importmap audit)
  - Code style enforcement (RuboCop)
  - Automated testing including system tests
- **Dependabot**: Automated dependency updates

## Deployment

### Docker Configuration
- Multi-stage Dockerfile for production optimization
- Runs as non-root user for security
- Uses Thruster for performance acceleration
- Exposes port 80

### Kamal Deployment
- **Multi-server architecture**: Separate web and job servers (currently same host: 101.35.96.142)
- **PostgreSQL accessory**: Dedicated database container (postgres:17-alpine)
- **Tencent COS accessory**: Cloud storage upload service (custom container)
- **SSL certificates**: Automatic Let's Encrypt integration via Thruster proxy
- **Container registry**: Tencent Cloud container registry (ccr.ccs.tencentyun.com)
- Production-ready with proper health checks
- Environment variables and secrets management via KAMAL_REGISTRY_PASSWORD and other secrets
- Accessories accessible via local kamal docker network
- Persistent storage volume for SQLite databases and Active Storage files

### Kamal Commands
```bash
# Deploy to production
bin/kamal deploy

# Run Rails console in production
bin/kamal console

# View logs
bin/kamal logs

# Access production database console
bin/kamal dbc

# Access shell
bin/kamal shell
```

## Security Considerations

- Input validation for Xiaohongshu URLs
- File type restrictions for video uploads
- SQL injection protection via ActiveRecord
- XSS protection via Rails built-in features
- Regular security scans via Brakeman
- Secure session management with signed cookies
- Password encryption via bcrypt
- Email verification attempt limits and expiration
- IP address tracking for sessions and email verifications

## Environment Variables

Key environment variables (see .env for local development):
- `RAILS_MASTER_KEY` - Rails credentials master key
- `SEND_CLOUD_SMTP_USERNAME` - SendCloud API username
- `SEND_CLOUD_SMTP_PASSWORD` - SendCloud API password
- `EMAIL_FROM` - Sender email address
- `EMAIL_FROM_NAME` - Sender name (default: "LazyLearn")
- `TENCENTCLOUD_SECRET_ID` - Tencent Cloud API secret ID (production)
- `TENCENTCLOUD_SECRET_KEY` - Tencent Cloud API secret key (production)
- `COS_BUCKET_URL` - Tencent COS bucket URL (production)
- `POSTGRES_PASSWORD` - PostgreSQL password (production)
- `NEW_WEB_DATABASE_PASSWORD` - Application database password (production)
- `KAMAL_REGISTRY_PASSWORD` - Container registry password (production)
- `mission_control_user` - Mission Control Jobs username (production)
- `mission_control_password` - Mission Control Jobs password (production)

## Performance Optimization

- Background job processing for transcription (Solid Queue)
- Database indexing on frequently queried fields (download_link, transcription_status, transcription_language, email, expires_at)
- Unique constraints prevent duplicate video processing
- Pagy for efficient pagination
- Asset precompilation for production (Propshaft)
- Thruster for HTTP request acceleration and SSL termination
- jemalloc memory allocator in production (reduced memory usage and latency)
- Bootsnap for reduced boot times through caching
- Solid Cache for Rails.cache
- Solid Cable for Action Cable

## Key Integrations

- **Pagy** - Pagination library for video lists
- **Letter Opener** - Email preview in development (opens automatically)
- **Down** - File download library for video downloads
- **Nokogiri** - HTML/XML parsing for Xiaohongshu content extraction
- **Typhoeus** - Parallel HTTP requests for improved performance
- **HTTParty** - HTTP client for transcription service communication
- **Active Storage** - File attachment management
- **Solid Queue** - Background job processing
- **Mission Control Jobs** - Web UI for job monitoring
- **Rails Pulse** - Performance monitoring dashboard