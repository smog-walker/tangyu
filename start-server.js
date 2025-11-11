// 服务器启动检查脚本
const { spawn } = require('child_process');
const axios = require('axios');

async function startServerAndTest() {
    console.log('🚀 启动糖域卫士服务器并测试AI分析功能...\n');
    
    // 检查是否已安装依赖
    try {
        require('express');
        require('mongoose');
        console.log('✅ 项目依赖已安装');
    } catch (error) {
        console.log('❌ 项目依赖未安装，正在安装...');
        const install = spawn('npm', ['install'], { stdio: 'inherit' });
        
        await new Promise((resolve, reject) => {
            install.on('close', (code) => {
                if (code === 0) {
                    console.log('✅ 依赖安装完成');
                    resolve();
                } else {
                    reject(new Error('依赖安装失败'));
                }
            });
        });
    }

    // 启动服务器
    console.log('🔧 启动服务器...');
    const server = spawn('node', ['server-fixed.js'], { stdio: 'pipe' });
    
    let serverStarted = false;
    
    // 监听服务器输出
    server.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('服务器:', output.trim());
        
        if (output.includes('服务器运行在') || output.includes('修复版服务器运行在')) {
            serverStarted = true;
            console.log('✅ 服务器启动成功');
            
            // 等待服务器完全启动
            setTimeout(() => {
                console.log('\n🧪 开始测试AI分析功能...');
                // 运行测试脚本
                const testProcess = spawn('node', ['test-ai-analysis.js'], { stdio: 'inherit' });
                
                testProcess.on('close', (code) => {
                    console.log('\n测试完成，关闭服务器...');
                    server.kill();
                    process.exit(code);
                });
            }, 2000);
        }
    });
    
    server.stderr.on('data', (data) => {
        console.error('服务器错误:', data.toString());
    });
    
    // 设置超时
    setTimeout(() => {
        if (!serverStarted) {
            console.log('❌ 服务器启动超时');
            server.kill();
            process.exit(1);
        }
    }, 10000);
    
    // 处理进程退出
    process.on('SIGINT', () => {
        console.log('\n正在关闭服务器...');
        server.kill();
        process.exit();
    });
}

// 运行启动脚本
startServerAndTest();