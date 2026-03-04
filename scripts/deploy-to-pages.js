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
  console.log('Starting deployment process...\n');
  
  try {
    // 1. 更新版本号
    console.log('Step 1: Updating version...');
    const newVersion = updateVersion();
    
    // 2. 创建带时间戳的 commit (在当前项目)
    console.log('\nStep 2: Creating timestamp commit in current project...');
    createTimestampCommit();
    
    // 3. 部署文件到目标目录
    console.log('\nStep 3: Deploying files to target directory...');
    const sourceDir = path.resolve(__dirname, '../dist/matthew-learning-tools/browser/browser');
    const targetDir = '/Users/I340818/workspace/personal/workspace/sssunsha.github.io';
    
    if (!fs.existsSync(sourceDir)) {
      console.error(`Build output not found: ${sourceDir}`);
      process.exit(1);
    }
    
    ensureDir(targetDir);
    clearTarget(targetDir);
    copyRecursive(sourceDir, targetDir);
    commitChanges(targetDir);
    
    console.log(`\n✓ Deployed to ${targetDir}`);
    console.log(`✓ Version: ${newVersion}`);
    console.log('\n✓ Deployment completed successfully!');
  } catch (error) {
    console.error('\n✗ Deployment failed:', error.message);
    process.exit(1);
  }
}

deploy();