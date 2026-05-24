# Android 构建网络问题排查

## 问题现象

构建报错，连接 `dl.google.com` 超时：
```
Connect to dl.google.com:443 failed: Connect timed out
```

## 根本原因

Cordova 自动生成的 `repositories.gradle` 文件默认只有 `google()`，而 `dl.google.com` 在国内无法直连。

## 已有的解决方案

本项目已在三个层面配置阿里云镜像：

| 层级 | 文件 | 说明 |
|------|------|------|
| 根级 | `cordova-app/platforms/android/build.gradle` | 根项目 buildscript |
| 子项目 | `app/repositories.gradle`、`CordovaLib/repositories.gradle` | 子项目 buildscript |
| 全局 | `~/.gradle/init.d/aliyun-mirrors.gradle` | 兜底，对所有 Gradle 项目生效 |
| 自动化 | Cordova `before_build` 钩子 | platform add 后自动重新注入 |

**正常情况下无需手动操作**，直接 `npm run android:deploy` 即可。

---

## 排查步骤

### 第一步：运行连通性检测

```bash
npm run android:check
```

全部 ✅ 则可以直接构建；有 ❌ 则按提示修复。

### 常见问题

#### 问题 1：gradle.properties 里有未注释的代理配置

`npm run android:check` 会检测到。手动编辑 `cordova-app/gradle.properties`，确保没有生效的 `systemProp.http.proxyHost` 行。

**原因：** 任何代理配置（如企业内网代理）不可达时，会把所有请求（包括阿里云镜像）全部阻断，造成 30 分钟超时。

#### 问题 2：repositories.gradle 未包含阿里云镜像

通常发生在 `cordova platform add android` 之后。

```bash
npm run android:setup-mirror
```

或者等下次 `npm run android:debug` 时，`before_build` 钩子会自动修复。

#### 问题 3：Gradle 缓存损坏

```bash
rm -rf ~/.gradle/caches/modules-*/files-*/com.android.tools*
npm run android:debug
```

---

## 相关文件

- [cordova-app/gradle.properties](cordova-app/gradle.properties) — Gradle 全局配置（无代理）
- [cordova-app/platforms/android/build.gradle](cordova-app/platforms/android/build.gradle) — Android 构建仓库配置
- [cordova-app/scripts/inject-aliyun-repos.js](cordova-app/scripts/inject-aliyun-repos.js) — Cordova 钩子
- `~/.gradle/init.d/aliyun-mirrors.gradle` — 全局 Gradle init 脚本
