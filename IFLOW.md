# LazyLearn 项目 - iFlow 指南

## 项目概述

LazyLearn 是一个基于 Ruby on Rails 8.0 的视频学习平台，主要功能是从小红书等平台下载视频并提供自动转录服务。该应用集成了多种转录服务（腾讯云 ASR 和 OpenAI Whisper），支持多语言转录，并提供了完整的视频管理和播放功能。应用包含用户认证系统、邮箱验证、会话管理、文件上传（本地和腾讯云 COS）、单词查找服务以及 PWA 支持，为用户提供移动端友好的学习体验。

## 技术栈

- **后端框架**: Ruby on Rails 8.0.4
- **Ruby 版本**: 3.4.6
- **前端**: Stimulus.js + Turbo + Tailwind CSS
- **数据库**: SQLite (开发/测试), PostgreSQL (生产)
- **任务队列**: Solid Queue
- **缓存**: Solid Cache
- **实时通信**: Solid Cable
- **容器化**: Docker + Kamal 部署
- **Web 服务器**: Puma + Thruster
- **文件存储**: Active Storage
- **性能监控**: Rails Pulse
- **任务监控**: Mission Control Jobs
- **HTTP 客户端**: HTTParty, Typhoeus
- **文件处理**: Down, Nokogiri
- **安全**: Bcrypt (密码加密)
- **分页**: Pagy
- **邮件服务**: SendCloud API
- **PWA 支持**: Progressive Web App
- **开发工具**: Solargraph, RuboCop, Brakeman

## 核心功能

### 1. 用户认证和注册系统
- 用户注册和登录系统
- 邮箱验证码验证
- 安全的密码存储 (bcrypt)
- 会话管理（包含 IP 地址和用户代理记录）
- 密码重置功能
- 频率限制和安全防护

### 2. 视频下载和管理
- 支持从小红书平台下载视频
- 视频文件存储和管理
- 视频链接缓存机制
- 本地文件上传和腾讯云 COS 云存储
- 用户-视频关联管理

### 3. 自动转录服务
- 腾讯云 ASR 转录服务
- OpenAI Whisper 转录服务
- 支持多语言转录（中文、英文、日文、韩文、西班牙文、法文、德文）
- 异步转录处理
- 转录结果展示和编辑

### 4. 视频播放器
- 基于转录文本的时间戳导航
- 支持单词级别的查找和定位
- 集成 Plyr 视频播放器
- 响应式设计，支持移动端

### 5. 单词查找服务
- 集成 ECDICT 词典
- 支持视频内容中的单词查找和解释
- 单词收藏和学习功能

### 6. 小红书解析服务
- 解析小红书分享链接
- 提取视频元数据和描述信息
- 批量处理和下载功能

### 7. PWA 功能
- 离线访问支持
- 应用图标和启动画面
- 移动端原生体验

## 项目结构

```
app/
├── controllers/          # 控制器
│   ├── application_controller.rb
│   ├── videos_controller.rb      # 视频管理
│   ├── welcome_controller.rb     # 首页
│   ├── word_lookup_controller.rb # 单词查找
│   ├── video_player_controller.rb # 视频播放
│   ├── xhs_parse_controller.rb   # 小红书解析
│   ├── sessions_controller.rb    # 会话管理
│   ├── passwords_controller.rb   # 密码管理
│   ├── uploads_controller.rb     # 文件上传
│   ├── registrations_controller.rb # 用户注册
│   └── email_verifications_controller.rb # 邮箱验证
├── models/              # 数据模型
│   ├── video.rb         # 视频模型
│   ├── upload.rb        # 上传模型
│   ├── ecdict_word.rb   # 词典单词模型
│   ├── user.rb          # 用户模型
│   ├── session.rb       # 会话模型
│   ├── user_video.rb    # 用户-视频关联模型
│   ├── email_verification.rb # 邮箱验证模型
│   └── current.rb       # 当前用户上下文
├── services/            # 业务逻辑服务
│   ├── transcription_service.rb      # 转录服务
│   ├── tencent_asr_service.rb        # 腾讯云 ASR
│   ├── whisper_transcription_service.rb # Whisper 转录
│   ├── word_lookup_service.rb        # 单词查找服务
│   ├── verification_code_service.rb  # 验证码服务
│   ├── util.rb                       # 工具类
│   └── downloader/                   # 下载器
│       ├── xhs.rb                    # 小红书下载器
│       ├── xhs_converter.rb          # 转换器
│       ├── xhs_explore.rb            # 探索器
│       └── xhs_url_parser.rb         # URL 解析器
├── jobs/               # 后台任务
│   ├── transcription_job.rb  # 转录任务
│   ├── cos_upload_job.rb     # COS 上传任务
│   └── local_upload_job.rb   # 本地上传任务
├── mailers/            # 邮件服务
│   ├── application_mailer.rb
│   ├── passwords_mailer.rb
│   └── verification_mailer.rb # 验证码邮件
└── views/              # 视图模板
    ├── videos/
    ├── welcome/
    ├── sessions/
    ├── passwords/
    ├── uploads/
    ├── xhs_parse/
    ├── registrations/
    ├── email_verifications/
    ├── verification_mailer/
    └── pwa/               # PWA 模板
```

## 开发环境设置

### 前置要求
- Ruby 3.4.6
- Rails 8.0.4
- PostgreSQL (生产环境)
- Redis (可选，用于缓存)
- Docker (用于部署)

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://gitee.com/qin-sicheng/lazy.git
   cd lazy
   ```

2. **安装依赖**
   ```bash
   bundle install
   ```

3. **环境变量配置**
   ```bash
   # 复制环境变量模板
   cp .env.example .env
   
   # 编辑 .env 文件，配置必要的环境变量
   # 包括：SEND_CLOUD_SMTP_USERNAME, SEND_CLOUD_SMTP_PASSWORD, EMAIL_FROM 等
   ```

4. **数据库设置**
   ```bash
   rails db:create
   rails db:migrate
   rails db:seed  # 如果有种子数据
   ```

5. **启动开发服务器**
   ```bash
   # 使用 foreman 启动所有服务
   gem install foreman
   foreman start -f Procfile.dev
   
   # 或者分别启动
   rails server
   rails tailwindcss:watch
   ```

### 可用的 Rails 命令

```bash
# 数据库操作
rails db:create          # 创建数据库
rails db:migrate         # 运行迁移
rails db:seed           # 加载种子数据
rails db:reset          # 重置数据库

# 服务器
rails server            # 启动开发服务器
rails console           # 启动控制台

# 测试
rails test              # 运行测试
rails test:system       # 运行系统测试

# 任务
rails jobs:work         # 启动任务队列工作进程
rails tailwindcss:build # 构建 Tailwind CSS

# 代码质量
rubocop                 # 代码风格检查
brakeman               # 安全扫描
solargraph              # 语言服务器

# Kamal 部署
kamal deploy            # 部署到生产环境
kamal details           # 查看部署状态
kamal logs              # 查看日志
kamal console           # 访问生产控制台
kamal shell             # 访问生产 shell
```

## 生产部署

### Docker 部署

项目使用 Docker 和 Kamal 进行部署：

```bash
# 构建镜像
docker build -t lazy .

# 运行容器
docker run -d -p 80:80 -e RAILS_MASTER_KEY=<key> lazy
```

### Kamal 部署

```bash
# 部署到生产环境
kamal deploy

# 查看部署状态
kamal details

# 查看日志
kamal logs

# 访问控制台
kamal console

# 访问 shell
kamal shell
```

### 部署配置

生产环境部署配置在 `config/deploy.yml` 中：
- **服务器**: 101.35.96.142
- **域名**: www.lazylearn.work
- **SSL**: 启用 Let's Encrypt 自动证书
- **数据库**: PostgreSQL 17
- **云存储**: 腾讯云 COS
- **镜像仓库**: 腾讯云容器镜像服务 (ccr.ccs.tencentyun.com)
- **服务名称**: new_web
- **容器镜像**: lucas_rcc/new_web

### 附加服务

部署配置包含以下附加服务：
- **数据库服务**: PostgreSQL 17 容器
- **COS 上传服务**: 独立的腾讯云 COS 上传服务容器
- **任务处理**: Solid Queue 在 Puma 进程中运行
- **监控面板**: Mission Control Jobs 和 Rails Pulse

## 开发约定

### 代码风格
- 使用 RuboCop 进行代码风格检查
- 遵循 Rails Omakase 风格指南
- 使用注释解释复杂业务逻辑

### 测试
- 使用 Rails 内置测试框架
- 控制器测试位于 `test/controllers/`
- 模型测试位于 `test/models/`
- 系统测试位于 `test/system/`

### 提交规范
- 使用语义化提交信息
- 运行测试和代码检查后再提交

## 关键服务说明

### TranscriptionService
负责视频转录的核心服务，支持两种转录工具：
- `:tencent` - 腾讯云 ASR 服务
- `:whisper` - OpenAI Whisper 服务

### Downloader::Xhs
小红书视频下载器，解析小红书分享链接并下载视频，包含以下组件：
- `XhsConverter` - 格式转换器
- `XhsExplore` - 探索器
- `XhsUrlParser` - URL 解析器

### 文件上传服务
- `LocalUploadJob` - 本地文件上传
- `CosUploadJob` - 腾讯云 COS 上传

### 用户认证和注册
- 基于 bcrypt 的安全密码存储
- 会话管理和 IP 地址记录
- 密码重置功能
- 邮箱验证码系统

### VerificationCodeService
邮箱验证码服务，提供以下功能：
- 验证码生成和发送
- 频率限制（邮箱和 IP 级别）
- 验证码验证和过期处理
- 安全防护机制

### 邮件服务
- 基于 SendCloud API 的邮件发送
- 支持验证码邮件和密码重置邮件
- HTML 邮件模板支持
- 开发环境使用 Letter Opener

### 分页服务
- 使用 Pagy gem 实现高效分页
- 支持多种分页样式
- 性能优化的分页查询

## 常见问题

### 转录服务配置
转录服务需要配置相应的 API 密钥，请在 `config/credentials.yml.enc` 中添加：
- 腾讯云 ASR 密钥
- OpenAI API 密钥（如使用 Whisper）

### 文件存储
- 开发环境：视频文件存储在 `storage/` 目录下
- 生产环境：使用腾讯云 COS 对象存储服务

### 性能优化
- 使用 Solid Cache 进行缓存
- 使用 Solid Queue 处理异步任务
- 使用 Thruster 提高静态资源服务性能
- 使用 Rails Pulse 进行性能监控
- 使用 Pagy 实现高效分页
- 静态资源优化和压缩

### PWA 功能
- 离线访问支持
- 应用图标和启动画面
- 移动端原生体验
- Service Worker 支持
- 响应式设计优化

## 监控和维护

- 任务监控：访问 `/jobs` 查看 Mission Control Jobs 面板
- 性能监控：访问 `/rails_pulse` 查看 Rails Pulse 面板
- 健康检查：访问 `/up` 检查应用状态
- 日志：查看 `log/` 目录下的日志文件

## 扩展开发

### 添加新的转录服务
1. 在 `app/services/` 下创建新的服务类
2. 在 `TranscriptionService` 中添加新的 case 分支
3. 更新模型中的相关配置

### 添加新的视频源
1. 在 `app/services/downloader/` 下创建新的下载器
2. 在 `XhsParseController` 中添加相应的处理逻辑
3. 更新路由配置

### 添加新的认证方式
1. 在 `app/models/user.rb` 中添加新的认证字段
2. 在相应的控制器中添加认证逻辑
3. 更新会话管理功能

### 添加新的邮件服务
1. 在 `app/mailers/` 下创建新的邮件服务类
2. 在 `app/services/` 下创建相应的业务逻辑服务
3. 更新邮件模板和配置

### 扩展 PWA 功能
1. 更新 `app/views/pwa/` 下的模板文件
2. 修改 `config/routes.rb` 中的 PWA 路由
3. 优化 Service Worker 和缓存策略

## 安全注意事项

- 所有用户输入都应进行验证和清理
- 使用 Rails 的 CSRF 保护
- 定期运行 Brakeman 进行安全扫描
- 敏感信息使用 Rails credentials 管理
- 密码使用 bcrypt 加密存储
- 会话管理包含 IP 地址和用户代理记录
- 生产环境强制使用 HTTPS
- 定期更新依赖包以修复安全漏洞

## 环境变量配置

生产环境需要配置以下环境变量：

### 基础配置
- `RAILS_MASTER_KEY` - Rails 主密钥
- `POSTGRES_PASSWORD` - 数据库密码
- `NEW_WEB_DATABASE_PASSWORD` - 应用数据库密码

### 腾讯云服务
- `TENCENTCLOUD_SECRET_ID` - 腾讯云密钥 ID
- `TENCENTCLOUD_SECRET_KEY` - 腾讯云密钥
- `COS_BUCKET_URL` - 腾讯云 COS 存储桶 URL
- `COS_BUCKET_CDN_URL` - 腾讯云 COS CDN URL

### 邮件服务
- `SEND_CLOUD_SMTP_USERNAME` - SendCloud 用户名
- `SEND_CLOUD_SMTP_PASSWORD` - SendCloud 密码
- `EMAIL_FROM` - 发件人邮箱
- `EMAIL_FROM_NAME` - 发件人名称
- `USE_LETTER_OPENER` - 开发环境是否使用 Letter Opener

### 监控和管理
- `mission_control_password` - 任务监控密码
- `mission_control_user` - 任务监控用户名

### 部署配置
- `KAMAL_REGISTRY_PASSWORD` - 容器镜像仓库密码