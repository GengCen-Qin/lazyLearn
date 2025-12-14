# Lazy 项目 - iFlow 指南

## 项目概述

Lazy 是一个基于 Ruby on Rails 8.0 的视频转录和处理应用，主要功能是从小红书等平台下载视频并提供自动转录服务。该应用集成了多种转录服务（腾讯云 ASR 和 OpenAI Whisper），支持多语言转录，并提供了完整的视频管理和播放功能。

## 技术栈

- **后端框架**: Ruby on Rails 8.0.4
- **前端**: Stimulus.js + Turbo + Tailwind CSS
- **数据库**: SQLite (开发/测试), PostgreSQL (生产)
- **任务队列**: Solid Queue
- **缓存**: Solid Cache
- **实时通信**: Solid Cable
- **容器化**: Docker + Kamal 部署
- **Web 服务器**: Puma + Thruster
- **文件存储**: Active Storage

## 核心功能

### 1. 视频下载和管理
- 支持从小红书平台下载视频
- 视频文件存储和管理
- 视频链接缓存机制

### 2. 自动转录服务
- 腾讯云 ASR 转录服务
- OpenAI Whisper 转录服务
- 支持多语言转录（中文、英文、日文、韩文、西班牙文、法文、德文）
- 异步转录处理

### 3. 视频播放器
- 基于转录文本的时间戳导航
- 支持单词级别的查找和定位
- 集成 Plyr 视频播放器

### 4. 单词查找服务
- 集成 ECDICT 词典
- 支持视频内容中的单词查找和解释

## 项目结构

```
app/
├── controllers/          # 控制器
│   ├── application_controller.rb
│   ├── videos_controller.rb      # 视频管理
│   ├── welcome_controller.rb     # 首页和小红书下载
│   ├── word_lookup_controller.rb # 单词查找
│   └── video_player_controller.rb # 视频播放
├── models/              # 数据模型
│   ├── video.rb         # 视频模型
│   ├── upload.rb        # 上传模型
│   └── ecdict_word.rb   # 词典单词模型
├── services/            # 业务逻辑服务
│   ├── transcription_service.rb      # 转录服务
│   ├── tencent_asr_service.rb        # 腾讯云 ASR
│   ├── whisper_transcription_service.rb # Whisper 转录
│   ├── word_lookup_service.rb        # 单词查找服务
│   ├── video_link_cache.rb           # 视频链接缓存
│   └── downloader/                   # 下载器
├── jobs/               # 后台任务
│   └── transcription_job.rb  # 转录任务
└── views/              # 视图模板
    ├── videos/
    ├── welcome/
    └── layouts/
```

## 开发环境设置

### 前置要求
- Ruby 3.4.6
- Rails 8.0.4
- PostgreSQL (生产环境)
- Redis (可选，用于缓存)

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd lazy
   ```

2. **安装依赖**
   ```bash
   bundle install
   ```

3. **数据库设置**
   ```bash
   rails db:create
   rails db:migrate
   rails db:seed  # 如果有种子数据
   ```

4. **启动开发服务器**
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
```

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

### VideoLinkCache
视频链接缓存服务，避免重复下载相同视频。

### Downloader::Xhs
小红书视频下载器，解析小红书分享链接并下载视频。

## 常见问题

### 转录服务配置
转录服务需要配置相应的 API 密钥，请在 `config/credentials.yml.enc` 中添加：
- 腾讯云 ASR 密钥
- OpenAI API 密钥（如使用 Whisper）

### 文件存储
视频文件存储在 `storage/` 目录下，生产环境建议使用云存储服务。

### 性能优化
- 使用 Solid Cache 进行缓存
- 使用 Solid Queue 处理异步任务
- 使用 Thruster 提高静态资源服务性能

## 监控和维护

- 任务监控：访问 `/jobs` 查看 Mission Control Jobs 面板
- 健康检查：访问 `/up` 检查应用状态
- 日志：查看 `log/` 目录下的日志文件

## 扩展开发

### 添加新的转录服务
1. 在 `app/services/` 下创建新的服务类
2. 在 `TranscriptionService` 中添加新的 case 分支
3. 更新模型中的相关配置

### 添加新的视频源
1. 在 `app/services/downloader/` 下创建新的下载器
2. 在 `WelcomeController` 中添加相应的处理逻辑
3. 更新路由配置

## 安全注意事项

- 所有用户输入都应进行验证和清理
- 使用 Rails 的 CSRF 保护
- 定期运行 Brakeman 进行安全扫描
- 敏感信息使用 Rails credentials 管理