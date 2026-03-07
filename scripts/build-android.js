const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 更新版本号
function updateVersion() {
  const packagePath = path.join(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // 同步更新 Cordova config.xml 的版本号
  const configPath = path.join(__dirname, '../cordova-app/config.xml');
  let configXml = fs.readFileSync(configPath, 'utf8');
  configXml = configXml.replace(
    /version="[\d.]+"/,
    `version="${packageJson.version}"`
  );
  fs.writeFileSync(configPath, configXml);
  
  console.log(`✓ Version synced: ${packageJson.version}`);
  return packageJson.version;
}

// 复制构建文件到 Cordova www 目录
function copyBuildToCordova() {
  const sourceDir = path.join(__dirname, '../dist/matthew-learning-tools/browser/browser');
  const targetDir = path.join(__dirname, '../cordova-app/www');
  
  if (!fs.existsSync(sourceDir)) {
    throw new Error('Build output not found. Please run "npm run build" first.');
  }
  
  console.log('Copying build files to Cordova www directory...');
  
  // 清空目标目录
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
  fs.mkdirSync(targetDir, { recursive: true });
  
  // 复制文件
  function copyRecursive(src, dest) {
    const stats = fs.statSync(src);
    if (stats.isDirectory()) {
      fs.mkdirSync(dest, { recursive: true });
      const entries = fs.readdirSync(src);
      for (const entry of entries) {
        copyRecursive(path.join(src, entry), path.join(dest, entry));
      }
    } else {
      fs.copyFileSync(src, dest);
    }
  }
  
  copyRecursive(sourceDir, targetDir);
  console.log('✓ Files copied successfully');
}

// 构建 Android APK
function buildAndroid(buildType = 'debug') {
  console.log(`\nBuilding Android ${buildType} APK...`);
  const cordovaDir = path.join(__dirname, '../cordova-app');
  
  try {
    if (buildType === 'release') {
      execSync('npx cordova build android --release', { 
        cwd: cordovaDir, 
        stdio: 'inherit' 
      });
      console.log('\n✓ Release APK built successfully!');
      console.log('Location: cordova-app/platforms/android/app/build/outputs/apk/release/');
    } else {
      execSync('npx cordova build android', { 
        cwd: cordovaDir, 
        stdio: 'inherit' 
      });
      console.log('\n✓ Debug APK built successfully!');
      console.log('Location: cordova-app/platforms/android/app/build/outputs/apk/debug/');
    }
  } catch (error) {
    console.error('Error building Android app:', error.message);
    throw error;
  }
}

// 主流程
function main() {
  const buildType = process.argv[2] || 'debug'; // 'debug' or 'release'
  
  console.log('Starting Android build process...\n');
  
  try {
    // 1. 构建 Angular 项目
    console.log('Step 1: Building Angular project...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // 2. 同步版本号
    console.log('\nStep 2: Syncing version...');
    updateVersion();
    
    // 3. 复制文件到 Cordova
    console.log('\nStep 3: Copying files to Cordova...');
    copyBuildToCordova();
    
    // 4. 构建 Android APK
    console.log('\nStep 4: Building Android APK...');
    buildAndroid(buildType);
    
    console.log('\n✓ Android build completed successfully!');
  } catch (error) {
    console.error('\n✗ Build failed:', error.message);
    process.exit(1);
  }
}

main();