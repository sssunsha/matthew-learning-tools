const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const sourceDir = path.resolve(__dirname, '../dist/matthew-learning-tools/browser');
const targetDir = path.resolve(
  __dirname,
  '../../sssunsha.github.io'
);

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
  execSync(`git commit -m "Deploy ${timestamp}"`, { cwd: repoDir, stdio: 'inherit' });
}

if (!fs.existsSync(sourceDir)) {
  console.error(`Build output not found: ${sourceDir}`);
  process.exit(1);
}

ensureDir(targetDir);
clearTarget(targetDir);
copyRecursive(sourceDir, targetDir);
commitChanges(targetDir);

console.log(`Deployed to ${targetDir}`);
