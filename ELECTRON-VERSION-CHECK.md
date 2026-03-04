# Electron 版本检查机制

本文档说明 Electron 应用的智能版本检查机制。

## 工作原理

当 Electron 应用启动时，会自动执行以下流程：

### 1. 版本检查流程

```
启动应用
    ↓
获取本地版本 (package.json)
    ↓
尝试获取远程版本 (https://sssunsha.github.io/version.json)
    ↓
比较版本号
    ↓
┌─────────────────────┐
│  本地版本 > 远程版本  │ → 使用本地应用
├─────────────────────┤
│  本地版本 = 远程版本  │ → 使用本地应用
├─────────────────────┤
│  本地版本 < 远程版本  │ → 加载远程网站
├─────────────────────┤
│  无法获取远程版本    │ → 使用本地应用（降级处理）
└─────────────────────┘
```

### 2. 版本比较规则

版本号格式：`major.minor.patch` (例如: `1.2.3`)

- **本地版本 > 远程版本**：使用本地构建的应用
- **本地版本 = 远程版本**：使用本地构建的应用（保证离线可用）
- **本地版本 < 远程版本**：加载远程网站

## 远程版本信息

部署时，会在 GitHub Pages 根目录自动生成 `version.json` 文件：

```json
{
  "version": "0.0.3",
  "timestamp": "2026-03-04T08:20:45.123Z",
  "buildDate": "2026-03-04 16:20:45"
}
```

## 使用场景

### 场景 1：开发中的新功能
- 本地版本：`0.0.4`（开发中）
- 远程版本：`0.0.3`（已发布）
- **结果**：使用本地应用，可以测试新功能

### 场景 2：已发布的稳定版本
- 本地版本：`0.0.3`
- 远程版本：`0.0.3`
- **结果**：使用本地应用，保证离线可用

### 场景 3：远程已更新
- 本地版本：`0.0.2`
- 远程版本：`0.0.3`
- **结果**：加载远程网站，自动使用最新版本

### 场景 4：网络不可用
- 本地版本：`0.0.3`
- 远程版本：无法获取
- **结果**：使用本地应用（降级处理）

## 开发模式

在开发模式下（`npm run electron:dev`）：

```bash
NODE_ENV=development
```

- 总是使用本地开发服务器 (`http://localhost:4200`)
- 自动打开开发者工具
- 不进行版本检查（直接使用本地）

## 生产模式

在生产模式下（`npm run electron` 或打包后）：

- 执行完整的版本检查流程
- 根据版本比较结果决定加载本地或远程
- 加载本地时使用 `dist/` 目录的构建文件

## 部署工作流

### 1. 更新并部署网站
```bash
npm run deploy
```

这会：
- 自动更新版本号（例如 `0.0.2` → `0.0.3`）
- 构建并压缩应用
- 部署到 GitHub Pages
- 生成 `version.json` 文件

### 2. 打包 Electron 应用
```bash
npm run electron:pack
```

这会：
- 使用当前 `package.json` 的版本号
- 构建生产版本
- 打包为 macOS 应用

## 版本管理最佳实践

### 手动更新版本
如果需要手动更新版本号：

```bash
npm version patch   # 0.0.2 → 0.0.3 (小改动)
npm version minor   # 0.0.2 → 0.1.0 (新功能)
npm version major   # 0.0.2 → 1.0.0 (重大更新)
```

### 版本号建议

- **Patch (0.0.x)**：Bug 修复、小改进
- **Minor (0.x.0)**：新功能、向后兼容
- **Major (x.0.0)**：破坏性更改、重大重构

## 日志输出

应用启动时会在控制台输出版本信息：

```
Local version: 0.0.4
Remote version: 0.0.3
Local version is newer, using local app
```

或

```
Local version: 0.0.3
Remote version: 0.0.3
Local version equals remote version, using local app
```

或

```
Local version: 0.0.2
Remote version: 0.0.3
Remote version is newer, loading from web
```

## 故障排除

### 1. 总是加载远程版本
- 检查本地 `package.json` 的版本号
- 确认本地版本号是否大于远程版本

### 2. 无法加载远程版本
- 检查网络连接
- 确认 `https://sssunsha.github.io/version.json` 可访问
- 应用会自动降级到本地版本

### 3. 版本比较不正确
- 确保版本号格式为 `x.y.z`
- 版本号应该只包含数字和点号

## 技术实现

### version.json 生成
在 `scripts/deploy-to-pages.js` 中：

```javascript
const versionJson = {
  version: newVersion,
  timestamp: new Date().toISOString(),
  buildDate: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
};
fs.writeFileSync(
  path.join(targetDir, 'version.json'),
  JSON.stringify(versionJson, null, 2)
);
```

### Electron 版本检查
在 `electron.js` 中：

```javascript
// 获取远程版本
const remoteVersion = await getRemoteVersion();

// 比较版本
const comparison = compareVersions(localVersion, remoteVersion);

if (comparison > 0) {
  createWindow(false); // 使用本地
} else {
  createWindow(true);  // 使用远程
}
```

## 优势

1. **自动更新**：用户总能使用最新版本（通过远程加载）
2. **开发便利**：本地开发时可以测试新功能
3. **降级保护**：网络故障时仍可使用本地版本
4. **灵活切换**：根据版本号智能决策
5. **无需重新安装**：远程更新时不需要重新下载 Electron 应用