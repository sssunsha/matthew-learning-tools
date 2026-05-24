#!/bin/bash

# 配置阿里云镜像（国内构建专用）
# 注意：此脚本手动执行，通常不需要 — before_build 钩子会自动处理

set -e

echo "正在配置阿里云镜像..."
echo ""

ANDROID_DIR="cordova-app/platforms/android"
if [ ! -d "$ANDROID_DIR" ]; then
    echo "错误：未找到 Android 平台，请先运行："
    echo "  cd cordova-app && cordova platform add android"
    exit 1
fi

BUILD_GRADLE="$ANDROID_DIR/build.gradle"

# 备份
if [ -f "$BUILD_GRADLE" ]; then
    cp "$BUILD_GRADLE" "${BUILD_GRADLE}.backup.$(date +%Y%m%d_%H%M%S)"
fi

cat > "$BUILD_GRADLE" << 'GRADLE_EOF'
// 顶级构建文件

buildscript {
    repositories {
        // 阿里云镜像（优先），确保国内网络可靠下载
        maven { url 'https://maven.aliyun.com/repository/google' }
        maven { url 'https://maven.aliyun.com/repository/public' }
        maven { url 'https://maven.aliyun.com/repository/gradle-plugin' }
        maven { url 'https://maven.aliyun.com/repository/jcenter' }
        // 备用源
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.7.3'
    }
}

allprojects {
    repositories {
        // 阿里云镜像（优先），确保国内网络可靠下载
        maven { url 'https://maven.aliyun.com/repository/google' }
        maven { url 'https://maven.aliyun.com/repository/public' }
        maven { url 'https://maven.aliyun.com/repository/jcenter' }
        // 备用源
        google()
        mavenCentral()
    }
}

task clean(type: Delete) {
    delete rootProject.buildDir
}
GRADLE_EOF

# 同步更新 repositories.gradle
for REPOS_FILE in \
    "$ANDROID_DIR/repositories.gradle" \
    "$ANDROID_DIR/app/repositories.gradle" \
    "$ANDROID_DIR/CordovaLib/repositories.gradle"; do
    if [ -f "$REPOS_FILE" ]; then
        cat > "$REPOS_FILE" << 'REPOS_EOF'
ext.repos = {
    maven { url 'https://maven.aliyun.com/repository/google' }
    maven { url 'https://maven.aliyun.com/repository/public' }
    maven { url 'https://maven.aliyun.com/repository/gradle-plugin' }
    maven { url 'https://maven.aliyun.com/repository/jcenter' }
    google()
    mavenCentral()
}
REPOS_EOF
        echo "已更新：$REPOS_FILE"
    fi
done

echo ""
echo "配置完成！运行 npm run android:debug 开始构建。"
