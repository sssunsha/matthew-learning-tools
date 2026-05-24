#!/bin/bash
# setup-gradle-mirror-with-proxy.sh → 已改为直接使用阿里云镜像，无需代理
# 此文件重定向到 setup-gradle-mirror.sh
exec "$(dirname "$0")/setup-gradle-mirror.sh" "$@"
