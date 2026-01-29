# AGENTS.md - Lazy English 代码库指南

## 项目概述

这是一个 Ruby on Rails 8.0.4 应用程序，提供小红书视频下载和转录服务，专为英语学习者设计。应用包含视频管理、自动转录、字幕同步和单词查询功能。

## 构建和开发命令

### 开发环境设置
```bash
# 完整设置（安装依赖、准备数据库、启动服务器）
./bin/setup

# 跳过服务器启动
./bin/setup --skip-server

# 启动开发服务器（Rails + TailwindCSS 热重载）
./bin/dev

# 分别启动组件
rails server          # 启动 Rails 服务器
rails tailwindcss:watch  # 启动 TailwindCSS 监听器
```

### 数据库操作
```bash
# 数据库迁移
rails db:migrate
rails db:rollback

# 数据库重置
rails db:reset
rails db:setup

# 运行种子数据
rails db:seed
```

### 测试命令
```bash
# 运行所有测试
rails test
./bin/rails test

# 运行特定测试文件
rails test test/models/video_test.rb
rails test test/controllers/welcome_controller_test.rb

# 运行特定测试用例
rails test test/models/video_test.rb -n test_should_create_video

# 运行系统测试
rails test:system

# 运行单元测试
rails test:test

# 准备测试数据库
rails db:test:prepare
```

### 代码质量检查
```bash
# 运行 RuboCop 代码风格检查
./bin/rubocop

# 自动修复 RuboCop 问题
./bin/rubocop -a

# 运行 Brakeman 安全扫描
./bin/brakeman

# JavaScript 依赖审计
rails importmap:audit
```

### 后台任务
```bash
# 启动后台作业处理器
./bin/jobs

# 或者使用 Solid Queue
rails solid_queue:start

# 访问任务监控界面（需要身份验证）
# http://localhost:3000/jobs
```

### 字典数据库设置
```bash
# 设置 ECDICT 字典数据库
./setup_stardict.sh
```

## 代码风格指南

### Ruby/Rails 代码风格
- 遵循 **Rails Omakase** 风格指南
- 使用 `rubocop-rails-omakase` gem 进行代码检查
- 配置文件：`.rubocop.yml`

### 命名约定
- **模型类**: 单数名词，如 `Video`, `User`, `Upload`
- **控制器类**: 复数名词 + Controller，如 `VideosController`, `WelcomeController`
- **服务类**: 以 Service 结尾，如 `TranscriptionService`, `WordLookupService`
- **作业类**: 以 Job 结尾，如 `TranscriptionJob`, `CosUploadJob`
- **模块**: 使用命名空间，如 `Downloader::Xhs`, `Downloader::XhsUrlParser`

### 文件结构约定
```
app/
├── controllers/          # 控制器
│   ├── authentications/  # 认证相关控制器
│   └── *.rb
├── models/              # 模型
├── services/            # 服务对象
├── jobs/                # 后台作业
├── mailers/             # 邮件发送器
└── javascript/          # JavaScript 文件
    └── controllers/     # Stimulus 控制器
```

### 错误处理模式
```ruby
# 使用 rescue 块处理异常
def process
  # 业务逻辑
rescue => e
  Rails.logger.error("操作失败: #{e.message}, #{e.backtrace.join("\n")}")
  # 标记失败状态
  @video.failed!
end

# 使用 raise 抛出特定异常
raise "转录失败: #{response} video:#{@video.id}" if status == :failed
```

### 日志记录
- 使用 `Rails.logger.info` 记录信息性日志
- 使用 `Rails.logger.error` 记录错误日志
- 包含相关上下文信息（如视频ID、任务ID）

### 注释规范
- 模型使用 annotate gem 自动生成 schema 注释
- 方法使用 Yard 文档格式：
```ruby
# @param [Video] video - 要转录的视频
# @param [String] language - 视频语言
# @param [Symbol] tool - 使用的工具（:tencent 腾讯, :whisper OpenAI）
def initialize(video, language = "en", tool = nil)
```

## JavaScript/前端指南

### Stimulus 控制器
- 控制器文件位于 `app/javascript/controllers/`
- 命名约定：`*_controller.js`
- 使用模块化设计，功能分离到不同控制器

### 导入规则
- 使用 Rails Importmap 管理 JavaScript 依赖
- 没有 package.json，依赖通过 importmap 管理
- 控制器在 `app/javascript/controllers/index.js` 中注册

### 前端架构
- **视频播放器**: 分离的控制器模块（video_controls.js, player_controller.js）
- **字幕管理**: 独立的字幕控制器
- **单词查询**: word_lookup_controller.js
- **工具函数**: utils.js 共享工具

## 测试指南

### 测试结构
- 使用 Minitest 框架
- 测试文件位于 `test/` 目录
- 命名约定：`*_test.rb`

### 测试类型
- **模型测试**: `test/models/*_test.rb`
- **控制器测试**: `test/controllers/*_test.rb`
- **系统测试**: `test/system/*_test.rb`
- **作业测试**: `test/jobs/*_test.rb`
- **邮件测试**: `test/mailers/*_test.rb`

### 测试断言
```ruby
# 基本断言
assert_response :success
assert_equal expected, actual
assert_not_nil object

# 数据库断言
assert_difference 'Video.count', 1 do
  # 创建视频的代码
end

# 重定向断言
assert_redirected_to videos_url
```

## 部署和运维

### Docker 构建
```bash
# 构建 Docker 镜像
docker build -t lazy-english .

# 运行容器
docker run -d -p 80:80 -e RAILS_MASTER_KEY=<master_key> --name lazy-english lazy-english
```

### Kamal 部署
```bash
# 部署到生产环境
bin/kamal deploy

# 生产环境控制台
bin/kamal console

# 查看日志
bin/kamal logs

# 数据库控制台
bin/kamal dbc
```

### 环境变量
关键环境变量：
- `RAILS_MASTER_KEY` - Rails 凭证主密钥
- `SEND_CLOUD_SMTP_USERNAME` - SendCloud API 用户名
- `SEND_CLOUD_SMTP_PASSWORD` - SendCloud API 密码
- `EMAIL_FROM` - 发件人邮箱
- `EMAIL_FROM_NAME` - 发件人名称（默认："LazyLearn"）
- `TENCENTCLOUD_SECRET_ID` - 腾讯云 API Secret ID（生产环境）
- `TENCENTCLOUD_SECRET_KEY` - 腾讯云 API Secret Key（生产环境）

## 架构模式

### 服务对象模式
- 业务逻辑封装在服务类中
- 服务类负责单一职责
- 示例：`TranscriptionService`, `WordLookupService`

### 状态机模式
- 视频转录状态：`pending` → `processing` → `completed`/`failed`
- 使用 Rails enum 定义状态

### 后台处理
- 使用 Solid Queue 处理异步任务
- 作业类继承自 `ApplicationJob`
- 转录、文件上传等耗时操作在后台处理

### 多数据库支持
- 主数据库：PostgreSQL（生产）/ SQLite（开发）
- 字典数据库：SQLite（ECDICT 字典）
- 通过 `database.yml` 配置多个数据库连接

## 安全注意事项

### 输入验证
- 始终验证用户输入
- 使用 Rails 内置的 XSS 防护
- 文件类型限制（视频格式白名单）

### 认证和授权
- 使用 `has_secure_password` 和 bcrypt 加密密码
- 会话管理使用 signed cookies
- 控制器使用 `allow_unauthenticated_access` 指定公开访问

### 敏感信息
- 永远不要提交 `.env` 文件
- 使用 Rails credentials 管理密钥
- 生产环境密钥通过环境变量传递

## 性能优化

### 数据库优化
- 在频繁查询的字段上添加索引
- 使用 `includes` 避免 N+1 查询
- 分页使用 Pagy gem

### 缓存策略
- 使用 Solid Cache 进行缓存
- 视频列表使用分页
- 避免重复视频处理（唯一索引约束）

### 资产优化
- 生产环境预编译资产
- 使用 Propshaft 作为资产管道
- 启用压缩和缓存头

## 故障排除

### 常见问题
1. **转录服务失败**: 检查转录服务是否运行（localhost:8000 for Whisper）
2. **数据库连接问题**: 检查 database.yml 配置
3. **资产编译失败**: 运行 `rails assets:precompile`
4. **测试失败**: 运行 `rails db:test:prepare`

### 日志位置
- 开发日志：`log/development.log`
- 测试日志：`log/test.log`
- 生产日志：Docker 容器日志

## 贡献指南

### 代码提交
- 提交前运行测试：`rails test`
- 检查代码风格：`./bin/rubocop`
- 安全扫描：`./bin/brakeman`

### 分支策略
- `main` 分支：生产就绪代码
- 功能开发：从 `main` 创建特性分支
- 提交 Pull Request 进行代码审查

### 代码审查要点
1. 是否符合代码风格指南
2. 是否有充分的测试覆盖
3. 是否包含必要的错误处理
4. 性能影响评估
5. 安全考虑

---

*最后更新: 2025-01-29*
*适用于: Ruby on Rails 8.0.4, Ruby 3.4.6*