# syntax=docker.m.daocloud.io/docker/dockerfile:1
# check=error=true

ARG RUBY_VERSION=3.4.6
FROM docker.1ms.run/ruby:${RUBY_VERSION}-slim AS base
WORKDIR /rails

# 换清华源
RUN sed -i 's|deb.debian.org|mirrors.tuna.tsinghua.edu.cn|g' /etc/apt/sources.list.d/debian.sources && \
    sed -i 's|security.debian.org|mirrors.tuna.tsinghua.edu.cn|g' /etc/apt/sources.list.d/debian.sources && \
    sed -i 's|http://|https://|g' /etc/apt/sources.list.d/debian.sources

# 仅保留运行时依赖（无 python）
RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends \
      curl \
      libjemalloc2 \
      libvips \
      postgresql-client \
      ffmpeg \
      tini && \
    ln -s /usr/lib/$(uname -m)-linux-gnu/libjemalloc.so.2 /usr/local/lib/libjemalloc.so && \
    rm -rf /var/lib/apt/lists/*

# Rails 环境变量
ENV RAILS_ENV=production \
    BUNDLE_DEPLOYMENT=1 \
    BUNDLE_PATH=/usr/local/bundle \
    BUNDLE_WITHOUT=development \
    LD_PRELOAD=/usr/local/lib/libjemalloc.so

# ---- 2. 拉取 whisper.cpp 静态二进制 ----
FROM docker.1ms.run/debian:bookworm-slim AS whisper-builder
RUN sed -i 's|deb.debian.org|mirrors.tuna.tsinghua.edu.cn|g' /etc/apt/sources.list.d/debian.sources && \
    sed -i 's|security.debian.org|mirrors.tuna.tsinghua.edu.cn|g' /etc/apt/sources.list.d/debian.sources && \
    sed -i 's|http://|https://|g' /etc/apt/sources.list.d/debian.sources
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl && \
    rm -rf /var/lib/apt/lists/*
WORKDIR /tmp
# 官方 Linux x86_64 静态链接二进制（带 BLAS + AVX512，单文件）
RUN curl -fsSL -o whisper \
 https://github.com/ggerganov/whisper.cpp/releases/download/v1.5.4/whisper-blas-bin-x64-linux-avx512-fast-lto && \
 chmod +x whisper

# 预拉模型（base ≈ 150 MB，可换 tiny）
RUN mkdir -p /models && \
    curl -fsSL -o /models/ggml-base.bin \
 https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin

# ---- 3. 构建阶段（与原来相同） ----
FROM base AS build
RUN gem sources --add https://gems.ruby-china.com/ --remove https://rubygems.org && \
    gem install bundler:2.7.2
RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends build-essential git libyaml-dev pkg-config && \
    rm -rf /var/lib/apt/lists/*
COPY Gemfile Gemfile.lock vendor ./
RUN bundle install && \
    rm -rf ~/.bundle "${BUNDLE_PATH}"/ruby/*/cache "${BUNDLE_PATH}"/ruby/*/bundler/gems/*/.git && \
    bundle exec bootsnap precompile -j 1 --gemfile
COPY . .
RUN bundle exec bootsnap precompile -j 1 app/ lib/ && \
    SECRET_KEY_BASE_DUMMY=1 ./bin/rails assets:precompile

# ---- 4. 最终运行镜像 ----
FROM base
# 拷贝 whisper 可执行文件（保持同名）
COPY --from=whisper-builder /tmp/whisper /usr/local/bin/whisper
# 拷贝模型
COPY --from=whisper-builder /models /models
# 让 whisper 命令默认找到模型（可选环境变量）
ENV WHISPER_MODEL=/models/ggml-base.bin

# 非 root 用户
RUN groupadd --system --gid 1000 rails && \
    useradd rails --uid 1000 --gid 1000 --create-home --shell /bin/bash
USER 1000:1000

# 拷贝 Ruby 产物
COPY --chown=rails:rails --from=build "${BUNDLE_PATH}" "${BUNDLE_PATH}"
COPY --chown=rails:rails --from=build /rails /rails

ENTRYPOINT ["/rails/bin/docker-entrypoint"]
EXPOSE 80
CMD ["./bin/thrust", "./bin/rails", "server"]
