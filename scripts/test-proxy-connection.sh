#!/bin/bash

# 检测阿里云镜像连通性
# 用法：npm run android:test-connection

echo "检测 Android 构建网络环境..."
echo ""

PASS=0
FAIL=0

check() {
    local label="$1"
    local result="$2"
    if [ "$result" = "ok" ]; then
        echo "  ✅ $label"
        PASS=$((PASS+1))
    else
        echo "  ❌ $label"
        FAIL=$((FAIL+1))
    fi
}

# 1. 阿里云 google 镜像
echo "1️⃣  阿里云 google 镜像"
CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 \
    "https://maven.aliyun.com/repository/google/com/android/tools/build/gradle/maven-metadata.xml" 2>/dev/null)
[ "$CODE" = "200" ] && check "maven.aliyun.com/repository/google 可访问" "ok" || check "maven.aliyun.com/repository/google 不可访问（HTTP $CODE）" "fail"

# 2. 阿里云 public 镜像
echo "2️⃣  阿里云 public 镜像"
CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 \
    "https://maven.aliyun.com/repository/public/org/jetbrains/kotlin/kotlin-stdlib/maven-metadata.xml" 2>/dev/null)
[ "$CODE" = "200" ] \
    && check "maven.aliyun.com/repository/public 可访问" "ok" \
    || check "maven.aliyun.com/repository/public 不可访问（HTTP $CODE）" "fail"

# 3. gradle.properties 无代理
echo "3️⃣  gradle.properties 代理配置"
GRADLE_PROPS="cordova-app/gradle.properties"
if [ -f "$GRADLE_PROPS" ] && grep -q "^systemProp.http.proxyHost" "$GRADLE_PROPS" 2>/dev/null; then
    check "警告：gradle.properties 中存在未注释的代理配置，会导致所有请求超时" "fail"
else
    check "gradle.properties 无代理配置（正常）" "ok"
fi

# 4. repositories.gradle 镜像
echo "4️⃣  repositories.gradle 镜像配置"
REPOS="cordova-app/platforms/android/app/repositories.gradle"
if [ -f "$REPOS" ] && grep -q "maven.aliyun.com" "$REPOS"; then
    check "repositories.gradle 已配置阿里云镜像" "ok"
else
    check "repositories.gradle 未配置阿里云镜像 → 运行 npm run android:setup-mirror" "fail"
fi

# 5. Android 平台
echo "5️⃣  Android 平台"
[ -d "cordova-app/platforms/android" ] \
    && check "Android 平台已添加" "ok" \
    || check "Android 平台未添加 → 运行 cd cordova-app && cordova platform add android" "fail"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "结果：✅ $PASS 项通过  ❌ $FAIL 项失败"
if [ $FAIL -eq 0 ]; then
    echo "全部通过！可以运行 npm run android:deploy"
else
    echo "请按上方提示修复失败项后重试。"
fi
echo ""
