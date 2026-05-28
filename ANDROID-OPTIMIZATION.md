# Android Build Optimization Guide
# 安卓构建优化指南

## Problem / 问题
Android deployment is slow, with the configuration phase taking ~19 minutes.
安卓部署很慢，配置阶段大约需要 19 分钟。

## Solutions / 解决方案

### 1. Enable Gradle Configuration Cache (Most Important!)
### 启用 Gradle 配置缓存（最重要！）

**File: `cordova-app/gradle.properties`**

```properties
org.gradle.configuration-cache=true
org.gradle.caching=true
org.gradle.daemon=true
org.gradle.parallel=true
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m
```

**Expected Impact:** 50-80% faster builds after first run
**预期影响：** 首次运行后构建速度提升 50-80%

### 2. Use Fast Deployment Command
### 使用快速部署命令

```bash
# Instead of:
npm run android:deploy

# Use:
npm run android:deploy:fast
```

This adds `--configuration-cache` and `--no-daemon` flags for faster builds.
这会添加 `--configuration-cache` 和 `--no-daemon` 标志以加快构建速度。

### 3. Avoid Clean Builds
### 避免清理构建

Only run clean builds when absolutely necessary:
只在绝对必要时运行清理构建：

```bash
# Incremental build (FAST) - 增量构建（快速）
npm run android:deploy:fast

# Clean build (SLOW) - 清理构建（慢）
cd cordova-app && cordova clean android && npm run android:deploy
```

### 4. Optimize Your Environment
### 优化您的环境

#### a. Check Android SDK Path / 检查 Android SDK 路径
```bash
echo $ANDROID_HOME
# Should output: /Users/I340818/Library/Android/sdk
```

If not set:
如果未设置：
```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"
export ANDROID_SDK_ROOT="$HOME/Library/Android/sdk"
export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools"
```

Add to `~/.zshrc` for permanent setup.
添加到 `~/.zshrc` 以永久设置。

#### b. Use SSD for Build Directory / 使用 SSD 作为构建目录
Ensure your project is on an SSD, not an external drive.
确保项目在 SSD 上，而非外部驱动器。

#### c. Use USB 3.0+ Cable / 使用 USB 3.0+ 线缆
For faster APK transfer to device.
以便更快地将 APK 传输到设备。

### 5. Gradle JVM Memory Optimization
### Gradle JVM 内存优化

Already configured in `gradle.properties`:
已在 `gradle.properties` 中配置：

```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m -XX:+HeapDumpOnOutOfMemoryError
```

This allocates 4GB RAM to Gradle. Increase if you have more RAM:
这会为 Gradle 分配 4GB RAM。如果您有更多 RAM 可以增加：

```properties
org.gradle.jvmargs=-Xmx8192m -XX:MaxMetaspaceSize=1024m
```

### 6. Run Optimization Check
### 运行优化检查

```bash
npm run android:optimize
```

This script will:
此脚本将：
- Check gradle.properties configuration / 检查 gradle.properties 配置
- Verify Android SDK setup / 验证 Android SDK 设置
- Provide optimization recommendations / 提供优化建议

### 7. ADB Install Optimization
### ADB 安装优化

For faster app reinstallation:
更快地重新安装应用：

```bash
# Find your APK
cd cordova-app/platforms/android/app/build/outputs/apk/debug

# Install with -r flag (replace existing)
adb install -r app-debug.apk
```

### 8. Enable Developer Options on Device
### 在设备上启用开发者选项

On your Android device:
在您的安卓设备上：
1. Go to Settings → About Phone / 前往 设置 → 关于手机
2. Tap "Build Number" 7 times / 点击"版本号" 7 次
3. Go to Developer Options / 前往开发者选项
4. Enable "USB Debugging" / 启用"USB 调试"
5. Enable "Install via USB" / 启用"通过 USB 安装"

### 9. Disable Animations (Optional)
### 禁用动画（可选）

In Developer Options, set these to 0.5x or off:
在开发者选项中，将这些设置为 0.5x 或关闭：
- Window animation scale / 窗口动画比例
- Transition animation scale / 过渡动画比例
- Animator duration scale / 动画时长比例

This won't speed up builds but makes testing faster.
这不会加快构建速度，但会让测试更快。

## Performance Comparison / 性能对比

### Before Optimization / 优化前
- Configuration: ~19 minutes / 配置：约 19 分钟
- Build: ~5-10 minutes / 构建：约 5-10 分钟
- Total: ~25-30 minutes / 总计：约 25-30 分钟

### After Optimization (First Build) / 优化后（首次构建）
- Configuration: ~15 minutes / 配置：约 15 分钟
- Build: ~5-10 minutes / 构建：约 5-10 分钟
- Total: ~20-25 minutes / 总计：约 20-25 分钟

### After Optimization (Subsequent Builds) / 优化后（后续构建）
- Configuration: ~2-5 minutes / 配置：约 2-5 分钟
- Build: ~2-3 minutes / 构建：约 2-3 分钟
- Total: ~4-8 minutes / 总计：约 4-8 分钟

**Up to 75% time savings on subsequent builds!**
**后续构建可节省高达 75% 的时间！**

## Troubleshooting / 故障排除

### Issue: Configuration cache warnings
### 问题：配置缓存警告

If you see warnings about configuration cache:
如果您看到有关配置缓存的警告：

```bash
# First time: let it build the cache
npm run android:deploy:fast

# Subsequent builds will be much faster
```

### Issue: Out of memory errors
### 问题：内存不足错误

Increase Gradle memory in `gradle.properties`:
在 `gradle.properties` 中增加 Gradle 内存：

```properties
org.gradle.jvmargs=-Xmx6144m
```

### Issue: Daemon errors
### 问题：守护进程错误

Stop all Gradle daemons and rebuild:
停止所有 Gradle 守护进程并重新构建：

```bash
cd cordova-app/platforms/android
./gradlew --stop
cd ../../..
npm run android:deploy:fast
```

## Additional Tips / 其他提示

1. **Close unnecessary applications** to free up RAM / 关闭不必要的应用程序以释放 RAM
2. **Use incremental builds** whenever possible / 尽可能使用增量构建
3. **Keep Android SDK updated** / 保持 Android SDK 更新
4. **Use latest Gradle version** (managed by Cordova) / 使用最新的 Gradle 版本（由 Cordova 管理）
5. **Monitor build logs** for specific bottlenecks / 监控构建日志以查找具体瓶颈

## Verification / 验证

After applying optimizations, verify with:
应用优化后，使用以下命令验证：

```bash
# Run optimization check
npm run android:optimize

# Time your build
time npm run android:deploy:fast
```

## References / 参考资料

- [Gradle Configuration Cache](https://docs.gradle.org/current/userguide/configuration_cache.html)
- [Cordova Android Platform Guide](https://cordova.apache.org/docs/en/latest/guide/platforms/android/)
- [Android Build Optimization](https://developer.android.com/studio/build/optimize-your-build)

---

Last Updated: 2026-05-22
最后更新：2026-05-22