const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('开始全面测试应用访问情况...');
console.log('当前工作目录:', __dirname);

// 测试1: 检查文件是否存在
try {
    const htmlFilePath = path.join(__dirname, 'tangyu.html');
    const exists = fs.existsSync(htmlFilePath);
    console.log('\n测试1: 检查tangyu.html文件是否存在');
    console.log('文件路径:', htmlFilePath);
    console.log('文件存在:', exists);
    if (exists) {
        console.log('文件大小:', fs.statSync(htmlFilePath).size, 'bytes');
    }
} catch (error) {
    console.error('文件检查错误:', error.message);
}

// 测试2: 访问根页面
testPageAccess();

// 测试3: 登录API测试
setTimeout(testLoginAPI, 1000);

// 测试4: 查看服务器监听状态
setTimeout(checkServerStatus, 2000);

function testPageAccess() {
    console.log('\n测试2: 访问根页面 (http://localhost:3000)');
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/',
        method: 'GET',
        headers: {
            'Accept': 'text/html'
        }
    };

    const req = http.request(options, (res) => {
        console.log(`页面访问状态码: ${res.statusCode}`);
        console.log('响应头:', res.headers);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('页面内容长度:', data.length, 'bytes');
            console.log('页面内容前100字符:', data.substring(0, 100));
        });
    });

    req.on('error', (e) => {
        console.error(`页面访问错误: ${e.message}`);
    });

    req.end();
}

function testLoginAPI() {
    console.log('\n测试3: 登录API测试');
    const loginData = JSON.stringify({
        username: '111',
        password: '123'
    });

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(loginData)
        }
    };

    const req = http.request(options, (res) => {
        console.log(`登录API状态码: ${res.statusCode}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const result = JSON.parse(data);
                console.log('登录响应:', result);
            } catch (e) {
                console.error('解析登录响应失败:', e.message);
                console.log('原始响应:', data);
            }
        });
    });

    req.on('error', (e) => {
        console.error(`登录请求错误: ${e.message}`);
    });

    req.write(loginData);
    req.end();
}

function checkServerStatus() {
    console.log('\n测试4: 检查服务器监听状态');
    // 使用net模块检查端口监听
    const net = require('net');
    const client = new net.Socket();
    
    client.setTimeout(1000);
    
    client.connect(3000, 'localhost', () => {
        console.log('端口3000已被监听');
        client.destroy();
    });
    
    client.on('error', (e) => {
        console.error('端口连接错误:', e.message);
    });
    
    client.on('timeout', () => {
        console.error('端口连接超时');
        client.destroy();
    });
}