# syntax=docker/dockerfile:1
# check=error=true

ARG RUBY_VERSION=3.4.6

# mirr
FROM docker.1ms.run/ruby:$RUBY_VERSION-slim AS base

WORKDIR /rails

# mirr
RUN sed -i 's|deb.debian.org|mirrors.tuna.tsinghua.edu.cn|g' /etc/apt/sources.list.d/debian.sources && \
  sed -i 's|security.debian.org|mirrors.tuna.tsinghua.edu.cn|g' /etc/apt/sources.list.d/debian.sources && \
  sed -i 's|http://|https://|g' /etc/apt/sources.list.d/debian.sources

# 安装运行时依赖
RUN apt-get update -qq && \
  apt-get install -y --no-install-recommends \
  curl \
  libjemalloc2 \
  libvips \
  postgresql-client \
  python3 \
  python3-pip \
  python3-venv \
  python3-dev \
  ffmpeg \
  tini && \
  ln -s /usr/lib/$(uname -m)-linux-gnu/libjemalloc.so.2 /usr/local/lib/libjemalloc.so && \
  rm -rf /var/lib/apt/lists/*

# Python config
RUN python3 -m venv /venv
ENV PATH="/venv/bin:$PATH"
ENV VIRTUAL_ENV="/venv"

# Rails config
ENV RAILS_ENV="production" \
  BUNDLE_DEPLOYMENT="1" \
  BUNDLE_PATH="/usr/local/bundle" \
  BUNDLE_WITHOUT="development" \
  LD_PRELOAD="/usr/local/lib/libjemalloc.so"

# pip 换清华源 + 升级 pip
RUN pip install --upgrade pip && \
  pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple && \
  pip config set global.trusted-host pypi.tuna.tsinghua.edu.cn

# 安装 Python 依赖（现在随便装，没任何报错）
COPY requirements.txt /tmp/
RUN pip install --no-cache-dir -r /tmp/requirements.txt

# ====================== 编译阶段 ======================
FROM base AS build

# Install packages needed to build gems
RUN apt-get update -qq && \
  apt-get install --no-install-recommends -y build-essential git libyaml-dev pkg-config && \
  rm -rf /var/lib/apt/lists /var/cache/apt/archives \

  # 安装 gems（多线程加速）
  COPY Gemfile Gemfile.lock vendor ./

RUN bundle install && \
  rm -rf ~/.bundle/ "${BUNDLE_PATH}"/ruby/*/cache "${BUNDLE_PATH}"/ruby/*/bundler/gems/*/.git && \
  # -j 1 disable parallel compilation to avoid a QEMU bug: https://github.com/rails/bootsnap/issues/495
  bundle exec bootsnap precompile -j 1 --gemfile

# 拷贝完整代码
COPY . .

# Bootsnap 预编译 + assets 预编译
RUN bundle exec bootsnap precompile -j 1 app/ lib/
RUN SECRET_KEY_BASE_DUMMY=1 ./bin/rails assets:precompile

# ====================== 最终精简镜像 ======================
FROM base

# 把虚拟环境也拷贝过来（关键！）
COPY --from=build /venv /venv
ENV PATH="/venv/bin:$PATH"

# Run and own only the runtime files as a non-root user for security
RUN groupadd --system --gid 1000 rails && \
  useradd rails --uid 1000 --gid 1000 --create-home --shell /bin/bash
USER 1000:1000

# Copy built artifacts: gems, application
COPY --chown=rails:rails --from=build "${BUNDLE_PATH}" "${BUNDLE_PATH}"
COPY --chown=rails:rails --from=build /rails /rails

# Entrypoint prepares the database.
ENTRYPOINT ["/rails/bin/docker-entrypoint"]

# Start server via Thruster by default, this can be overwritten at runtime
EXPOSE 80
CMD ["./bin/thrust", "./bin/rails", "server"]