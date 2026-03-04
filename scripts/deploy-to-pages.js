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

// 创建带时间戳的 commit
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
      console.log('✓ No changes to commit');
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

// 主部署流程
async function deploy() {
  console.log('Starting deployment process...\n');
  
  try {
    // 1. 更新版本号
    console.log('Step 1: Updating version...');
    const newVersion = updateVersion();
    
    // 2. 创建带时间戳的 commit
    console.log('\nStep 2: Creating timestamp commit...');
    createTimestampCommit();
    
    // 3. 构建项目
    console.log('\nStep 3: Building project...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // 4. 压缩构建文件
    console.log('\nStep 4: Compressing build files...');
    execSync('node scripts/compress-build.js', { stdio: 'inherit' });
    
    // 5. 部署到 GitHub Pages
    console.log('\nStep 5: Deploying to GitHub Pages...');
    const distDir = path.join(__dirname, '../dist/matthew-learning-tools/browser');
    
    if (!fs.existsSync(distDir)) {
      throw new Error('Build directory not found. Please run build first.');
    }
    
    // 部署到 gh-pages 分支
    execSync(`npx gh-pages -d "${distDir}" -m "Deploy ${newVersion}"`, { stdio: 'inherit' });
    
    console.log('\n✓ Deployment completed successfully!');
    console.log(`✓ Version: ${newVersion}`);
  } catch (error) {
    console.error('\n✗ Deployment failed:', error.message);
    process.exit(1);
  }
}

deploy();