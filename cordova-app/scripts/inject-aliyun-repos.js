#!/usr/bin/env node
/**
 * Cordova before_build 钩子：自动将阿里云镜像注入所有 repositories.gradle
 * 解决 cordova platform add android 后重新生成的文件只有 google() 的问题
 */

const fs = require('fs');
const path = require('path');

const ALIYUN_REPOS = `
// 阿里云镜像优先，确保在国内网络环境下可靠下载
ext.repos = {
    maven { url 'https://maven.aliyun.com/repository/google' }
    maven { url 'https://maven.aliyun.com/repository/public' }
    maven { url 'https://maven.aliyun.com/repository/gradle-plugin' }
    maven { url 'https://maven.aliyun.com/repository/jcenter' }
    google()
    mavenCentral()
}
`;

const ORIGINAL_REPOS = `ext.repos = {
    google()
    mavenCentral()
}`;

module.exports = function(context) {
    const androidPlatformDir = path.join(
        context.opts.projectRoot,
        'platforms', 'android'
    );

    if (!fs.existsSync(androidPlatformDir)) {
        return;
    }

    const targets = [
        path.join(androidPlatformDir, 'repositories.gradle'),
        path.join(androidPlatformDir, 'app', 'repositories.gradle'),
        path.join(androidPlatformDir, 'CordovaLib', 'repositories.gradle'),
    ];

    let patchCount = 0;
    targets.forEach(function(filePath) {
        if (!fs.existsSync(filePath)) return;
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('maven.aliyun.com')) return; // 已配置，跳过
        const patched = content.replace(ORIGINAL_REPOS, ALIYUN_REPOS);
        if (patched !== content) {
            fs.writeFileSync(filePath, patched, 'utf8');
            console.log('[aliyun-mirror] 已注入阿里云镜像：' + path.basename(path.dirname(filePath)) + '/repositories.gradle');
            patchCount++;
        }
    });

    if (patchCount > 0) {
        console.log('[aliyun-mirror] 共更新 ' + patchCount + ' 个 repositories.gradle');
    }
};
