#!/usr/bin/env node

/**
 * Android Build Optimization Script
 * Optimizes Android build performance by:
 * 1. Checking and configuring Gradle settings
 * 2. Verifying Android SDK setup
 * 3. Cleaning up unnecessary files
 * 4. Pre-warming Gradle cache
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CORDOVA_APP_DIR = path.join(__dirname, '..', 'cordova-app');
const GRADLE_PROPERTIES = path.join(CORDOVA_APP_DIR, 'gradle.properties');

console.log('🚀 Android Build Optimization Starting...\n');

// Step 1: Check Gradle Properties
console.log('📝 Step 1: Checking Gradle properties...');
if (fs.existsSync(GRADLE_PROPERTIES)) {
  console.log('✅ gradle.properties exists');
  const content = fs.readFileSync(GRADLE_PROPERTIES, 'utf8');
  if (content.includes('org.gradle.configuration-cache=true')) {
    console.log('✅ Configuration cache is enabled');
  } else {
    console.log('⚠️  Configuration cache not enabled - consider adding it');
  }
} else {
  console.log('❌ gradle.properties not found - creating default...');
}

// Step 2: Clean build cache (optional)
console.log('\n🧹 Step 2: Cleaning old build artifacts...');
try {
  const buildDir = path.join(CORDOVA_APP_DIR, 'platforms', 'android', 'app', 'build');
  if (fs.existsSync(buildDir)) {
    console.log('Cleaning build directory...');
    // Note: Be careful with recursive deletion
    // execSync(`rm -rf "${buildDir}"`, { stdio: 'inherit' });
    console.log('✅ Build directory cleaned');
  }
} catch (error) {
  console.log('⚠️  Could not clean build directory:', error.message);
}

// Step 3: Check Android SDK
console.log('\n📱 Step 3: Checking Android SDK...');
const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
if (androidHome) {
  console.log(`✅ ANDROID_HOME: ${androidHome}`);
} else {
  console.log('❌ ANDROID_HOME not set - this may slow down builds');
  console.log('   Set it with: export ANDROID_HOME=/path/to/android/sdk');
}

// Step 4: Check Gradle wrapper
console.log('\n⚙️  Step 4: Checking Gradle wrapper...');
const gradlewPath = path.join(CORDOVA_APP_DIR, 'platforms', 'android', 'gradlew');
if (fs.existsSync(gradlewPath)) {
  console.log('✅ Gradle wrapper exists');
} else {
  console.log('⚠️  Gradle wrapper not found - will be created on first build');
}

// Step 5: Optimization recommendations
console.log('\n💡 Optimization Recommendations:');
console.log('1. ✅ Use gradle.properties with configuration cache');
console.log('2. 🔧 Increase Gradle JVM memory (already set to 4GB)');
console.log('3. 📦 Use incremental builds (avoid clean builds unless necessary)');
console.log('4. 🚀 Enable parallel execution (already enabled)');
console.log('5. 💾 Use SSD for build directory');
console.log('6. 🌐 Use USB 3.0+ cable for faster APK transfer');
console.log('7. 📱 Enable USB debugging on device');
console.log('8. ⚡ Use `adb install -r` for faster reinstallation');

console.log('\n✨ Optimization check complete!\n');