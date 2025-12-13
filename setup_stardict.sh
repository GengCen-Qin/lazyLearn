#!/bin/bash

# 检查 storage 目录下是否存在 stardict.db 文件
STARDICT_DB_PATH="storage/stardict.db"
DOWNLOAD_URL="https://github.com/skywind3000/ECDICT/releases/download/1.0.28/ecdict-sqlite-28.zip"
TEMP_ZIP="/tmp/ecdict-sqlite-28.zip"

echo "检查 stardict.db 文件..."

if [ -f "$STARDICT_DB_PATH" ]; then
    echo "stardict.db 已存在，无需下载。"
    exit 0
else
    echo "stardict.db 不存在，开始下载..."

    # 下载 zip 文件
    echo "正在下载 $DOWNLOAD_URL"
    if ! wget -O "$TEMP_ZIP" "$DOWNLOAD_URL"; then
        echo "下载失败，请检查网络连接。"
        exit 1
    fi

    # 解压到 storage 目录
    echo "解压文件到 storage 目录..."
    if ! unzip -o "$TEMP_ZIP" -d "storage/"; then
        echo "解压失败。"
        rm -f "$TEMP_ZIP"
        exit 1
    fi

    # 清理临时文件
    rm -f "$TEMP_ZIP"

    echo "stardict.db 下载和安装完成！"
fi