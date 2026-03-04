const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { promisify } = require('util');

const brotliCompress = promisify(zlib.brotliCompress);
const gzip = promisify(zlib.gzip);

const distDir = path.resolve(__dirname, '../dist/matthew-learning-tools/browser');

// File extensions to compress
const compressibleExtensions = ['.js', '.css', '.html', '.svg', '.txt', '.json', '.xml', '.ico'];

async function compressFile(filePath) {
  const ext = path.extname(filePath);
  if (!compressibleExtensions.includes(ext)) {
    return;
  }

  const content = fs.readFileSync(filePath);
  const fileSize = content.length;

  // Only compress files larger than 10KB
  if (fileSize < 10240) {
    return;
  }

  try {
    // Brotli compression
    const brotliCompressed = await brotliCompress(content, {
      params: {
        [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
      },
    });

    // Only save if compression ratio is good (< 80% of original)
    if (brotliCompressed.length < fileSize * 0.8) {
      fs.writeFileSync(`${filePath}.br`, brotliCompressed);
      console.log(`✓ Brotli: ${path.basename(filePath)} (${fileSize} → ${brotliCompressed.length} bytes)`);
    }

    // Gzip compression (fallback)
    const gzipCompressed = await gzip(content, { level: 9 });
    if (gzipCompressed.length < fileSize * 0.8) {
      fs.writeFileSync(`${filePath}.gz`, gzipCompressed);
      console.log(`✓ Gzip: ${path.basename(filePath)} (${fileSize} → ${gzipCompressed.length} bytes)`);
    }
  } catch (error) {
    console.error(`Error compressing ${filePath}:`, error.message);
  }
}

async function compressDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await compressDirectory(fullPath);
    } else if (entry.isFile()) {
      await compressFile(fullPath);
    }
  }
}

async function main() {
  if (!fs.existsSync(distDir)) {
    console.error(`Build directory not found: ${distDir}`);
    process.exit(1);
  }

  console.log('Starting compression...');
  await compressDirectory(distDir);
  console.log('Compression complete!');
}

main().catch((error) => {
  console.error('Compression failed:', error);
  process.exit(1);
});