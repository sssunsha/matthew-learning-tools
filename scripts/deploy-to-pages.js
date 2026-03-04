const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 更新版本号
function updateVersion() {
  const packagePath = path.join(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // 增加版本号的补丁版本
  const versionParts = packageJson.version.split('.');
  versionParts[2] = parseInt(versionParts[2]) + 1;
  packageJson.version = versionParts.join('.');
  
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`✓ Version updated to ${packageJson.version}`);
  
  return packageJson.version;
}

// 创建带时间戳的 commit (在当前项目中)
function createTimestampCommit() {
  const now = new Date();
  const timestamp = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/\//g, '-').replace(/,/g, '').replace(/:/g, '-');
  
  const commitMessage = `Deploy ${timestamp}`;
  
  try {
    // 添加所有改动
    execSync('git add .', { stdio: 'inherit' });
    
    // 检查是否有改动需要提交
    try {
      execSync('git diff --cached --quiet');
      console.log('✓ No changes to commit in current project');
    } catch (error) {
      // 有改动，创建 commit
      execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
      console.log(`✓ Created commit: ${commitMessage}`);
    }
  } catch (error) {
    console.error('Error creating commit:', error.message);
    throw error;
  }
}

// 构建 Android APK
function buildAndroidApp(newVersion) {
  console.log('\nBuilding Android APK...');
  try {
    // 同步版本号到 Cordova config.xml
    const configPath = path.join(__dirname, '../cordova-app/config.xml');
    let configXml = fs.readFileSync(configPath, 'utf8');
    configXml = configXml.replace(
      /version="[\d.]+"/,
      `version="${newVersion}"`
    );
    fs.writeFileSync(configPath, configXml);
    
    // 复制构建文件到 Cordova www
    const sourceDir = path.join(__dirname, '../dist/matthew-learning-tools/browser');
    const cordovaWww = path.join(__dirname, '../cordova-app/www');
    
    if (fs.existsSync(cordovaWww)) {
      fs.rmSync(cordovaWww, { recursive: true, force: true });
    }
    fs.mkdirSync(cordovaWww, { recursive: true });
    
    copyRecursive(sourceDir, cordovaWww);
    
    // 构建 Android APK (Release)
    const cordovaDir = path.join(__dirname, '../cordova-app');
    execSync('npx cordova build android --release', { 
      cwd: cordovaDir, 
      stdio: 'inherit' 
    });
    
    console.log('✓ Android APK built successfully');
    return path.join(cordovaDir, 'platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk');
  } catch (error) {
    console.error('Warning: Android build failed:', error.message);
    return null;
  }
}

// 构建 macOS Electron App
function buildMacOSApp(newVersion) {
  console.log('\nBuilding macOS Electron App...');
  try {
    execSync('npm run electron:pack', { stdio: 'inherit' });
    
    console.log('✓ macOS App built successfully');
    
    // 查找生成的 .app 文件
    const releaseDir = path.join(__dirname, '../release');
    if (fs.existsSync(releaseDir)) {
      const files = fs.readdirSync(releaseDir);
      const appDir = files.find(f => f.endsWith('.app'));
      if (appDir) {
        return path.join(releaseDir, appDir);
      }
    }
    return releaseDir;
  } catch (error) {
    console.error('Warning: macOS build failed:', error.message);
    return null;
  }
}

// 原有的部署函数
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function clearTarget(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === '.git') {
      continue;
    }
    const fullPath = path.join(dirPath, entry.name);
    fs.rmSync(fullPath, { recursive: true, force: true });
  }
}

function copyRecursive(src, dest) {
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    ensureDir(dest);
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
    return;
  }
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function getFileSize(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const size = stats.size;
      if (size > 1024 * 1024) {
        return `${(size / (1024 * 1024)).toFixed(2)} MB`;
      } else if (size > 1024) {
        return `${(size / 1024).toFixed(2)} KB`;
      }
      return `${size} bytes`;
    }
  } catch (error) {
    return 'unknown';
  }
  return 'not found';
}

function commitChanges(repoDir) {
  const now = new Date();
  const timestamp = new Intl.DateTimeFormat('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
    .format(now)
    .replace(' ', ' ');

  execSync('git add -A', { cwd: repoDir, stdio: 'inherit' });
  
  // Check if there are changes to commit
  try {
    const status = execSync('git status --porcelain', { cwd: repoDir, encoding: 'utf8' });
    if (status.trim()) {
      execSync(`git commit -m "Deploy ${timestamp}"`, { cwd: repoDir, stdio: 'inherit' });
      console.log(`Changes committed with timestamp: ${timestamp}`);
    } else {
      console.log('No changes to commit - files are already up to date');
    }
  } catch (error) {
    console.error('Error checking git status:', error.message);
  }
}

// 主部署流程
function deploy() {
  console.log('Starting enhanced deployment process...\n');
  
  try {
    // 1. 更新版本号
    console.log('Step 1: Updating version...');
    const newVersion = updateVersion();
    
    // 2. 创建带时间戳的 commit (在当前项目)
    console.log('\nStep 2: Creating timestamp commit in current project...');
    createTimestampCommit();
    
    // 3. 构建 Android APK
    console.log('\nStep 3: Building Android APK...');
    const androidApkPath = buildAndroidApp(newVersion);
    
    // 4. 构建 macOS Electron App
    console.log('\nStep 4: Building macOS Electron App...');
    const macOSAppPath = buildMacOSApp(newVersion);
    
    // 5. 部署文件到目标目录
    console.log('\nStep 5: Deploying files to target directory...');
    const sourceDir = path.resolve(__dirname, '../dist/matthew-learning-tools/browser/browser');
    const targetDir = '/Users/I340818/workspace/personal/workspace/sssunsha.github.io';
    
    if (!fs.existsSync(sourceDir)) {
      console.error(`Build output not found: ${sourceDir}`);
      process.exit(1);
    }
    
    ensureDir(targetDir);
    // 不清空目标目录，直接复制覆盖
    copyRecursive(sourceDir, targetDir);
    
    // 6. 复制构建的应用包到 downloads 目录
    console.log('\nStep 6: Copying built packages to downloads...');
    const downloadsDir = path.join(targetDir, 'downloads');
    ensureDir(downloadsDir);
    
    const packageInfo = {
      android: null,
      macos: null
    };
    
    // 复制 Android APK
    if (androidApkPath && fs.existsSync(androidApkPath)) {
      const androidTarget = path.join(downloadsDir, `MatthewTools-${newVersion}.apk`);
      fs.copyFileSync(androidApkPath, androidTarget);
      packageInfo.android = {
        filename: `MatthewTools-${newVersion}.apk`,
        size: getFileSize(androidTarget),
        path: `downloads/MatthewTools-${newVersion}.apk`
      };
      console.log(`✓ Android APK copied: ${packageInfo.android.filename} (${packageInfo.android.size})`);
    }
    
    // 复制 macOS App (压缩为 zip)
    if (macOSAppPath && fs.existsSync(macOSAppPath)) {
      const macZipName = `MatthewTools-${newVersion}-macos.zip`;
      const macZipPath = path.join(downloadsDir, macZipName);
      
      try {
        // 压缩 macOS app
        const appParentDir = path.dirname(macOSAppPath);
        const appName = path.basename(macOSAppPath);
        execSync(`cd "${appParentDir}" && zip -r "${macZipPath}" "${appName}"`, { 
          stdio: 'inherit' 
        });
        
        packageInfo.macos = {
          filename: macZipName,
          size: getFileSize(macZipPath),
          path: `downloads/${macZipName}`
        };
        console.log(`✓ macOS App copied: ${packageInfo.macos.filename} (${packageInfo.macos.size})`);
      } catch (error) {
        console.error('Warning: Failed to zip macOS app:', error.message);
      }
    }
    
    // 7. 创建增强的 version.json 文件
    console.log('\nStep 7: Creating enhanced version info...');
    const versionJson = {
      version: newVersion,
      timestamp: new Date().toISOString(),
      buildDate: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
      packages: packageInfo
    };
    
    fs.writeFileSync(
      path.join(targetDir, 'version.json'),
      JSON.stringify(versionJson, null, 2)
    );
    console.log('✓ Enhanced version info file created');
    
    // 8. 创建下载页面
    console.log('\nStep 8: Creating downloads page...');
    createDownloadsPage(targetDir, newVersion, packageInfo);
    
    // 9. 提交到目标仓库
    console.log('\nStep 9: Committing changes...');
    commitChanges(targetDir);
    
    console.log(`\n✓ Deployed to ${targetDir}`);
    console.log(`✓ Version: ${newVersion}`);
    if (packageInfo.android) {
      console.log(`✓ Android APK: ${packageInfo.android.size}`);
    }
    if (packageInfo.macos) {
      console.log(`✓ macOS App: ${packageInfo.macos.size}`);
    }
    console.log('\n✓ Enhanced deployment completed successfully!');
  } catch (error) {
    console.error('\n✗ Deployment failed:', error.message);
    process.exit(1);
  }
}

// 创建下载页面
function createDownloadsPage(targetDir, version, packageInfo) {
  const downloadHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Matthew Learning Tools - 下载</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 600px;
            width: 100%;
            padding: 40px;
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 10px;
            font-size: 2em;
        }
        .version {
            text-align: center;
            color: #667eea;
            font-size: 1.2em;
            margin-bottom: 30px;
            font-weight: 600;
        }
        .download-section {
            margin: 25px 0;
        }
        .download-card {
            border: 2px solid #e0e0e0;
            border-radius: 12px;
            padding: 20px;
            margin: 15px 0;
            transition: all 0.3s ease;
        }
        .download-card:hover {
            border-color: #667eea;
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.2);
            transform: translateY(-2px);
        }
        .platform-name {
            font-size: 1.3em;
            font-weight: 600;
            color: #333;
            margin-bottom: 10px;
        }
        .file-info {
            color: #666;
            font-size: 0.9em;
            margin: 5px 0;
        }
        .download-btn {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 8px;
            margin-top: 15px;
            font-weight: 600;
            transition: all 0.3s ease;
        }
        .download-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        .download-btn.disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        .back-link {
            text-align: center;
            margin-top: 30px;
        }
        .back-link a {
            color: #667eea;
            text-decoration: none;
            font-weight: 600;
        }
        .back-link a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📚 Matthew Learning Tools</h1>
        <div class="version">版本 ${version}</div>
        
        <div class="download-section">
            ${packageInfo.android ? `
            <div class="download-card">
                <div class="platform-name">🤖 Android 平板</div>
                <div class="file-info">文件: ${packageInfo.android.filename}</div>
                <div class="file-info">大小: ${packageInfo.android.size}</div>
                <a href="${packageInfo.android.path}" class="download-btn" download>下载 Android 版本</a>
            </div>
            ` : `
            <div class="download-card">
                <div class="platform-name">🤖 Android 平板</div>
                <div class="file-info">暂无可用版本</div>
                <span class="download-btn disabled">暂不可用</span>
            </div>
            `}
            
            ${packageInfo.macos ? `
            <div class="download-card">
                <div class="platform-name">🍎 macOS</div>
                <div class="file-info">文件: ${packageInfo.macos.filename}</div>
                <div class="file-info">大小: ${packageInfo.macos.size}</div>
                <a href="${packageInfo.macos.path}" class="download-btn" download>下载 macOS 版本</a>
            </div>
            ` : `
            <div class="download-card">
                <div class="platform-name">🍎 macOS</div>
                <div class="file-info">暂无可用版本</div>
                <span class="download-btn disabled">暂不可用</span>
            </div>
            `}
        </div>
        
        <div class="back-link">
            <a href="/">← 返回应用</a>
        </div>
    </div>
</body>
</html>`;

  fs.writeFileSync(path.join(targetDir, 'downloads.html'), downloadHtml);
  console.log('✓ Downloads page created');
}

deploy();