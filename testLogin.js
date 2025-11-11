const http = require('http');

// 登录测试
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
    
    res.on('data', (chunk) => {
        console.log('登录响应:', JSON.parse(chunk.toString()));
    });
});

req.on('error', (e) => {
    console.error(`请求错误: ${e.message}`);
});

// 发送请求体
req.write(loginData);
req.end();