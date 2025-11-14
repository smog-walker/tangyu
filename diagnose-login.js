const { connectDB, User } = require('./mongodb');
const http = require('http');

async function diagnoseLogin() {
    console.log('🔍 开始诊断登录问题...\n');
    
    // 1. 检查MongoDB连接
    console.log('1. 检查MongoDB连接...');
    try {
        await connectDB();
        console.log('✅ MongoDB连接成功');
        
        // 检查testuser是否存在
        const user = await User.findOne({ username: 'testuser' });
        if (user) {
            console.log('✅ testuser用户存在');
            console.log('   用户名:', user.username);
            console.log('   密码:', user.password);
            console.log('   用户ID:', user._id.toString());
        } else {
            console.log('❌ testuser用户不存在，需要重新初始化数据库');
        }
    } catch (error) {
        console.log('❌ MongoDB连接失败:', error.message);
        console.log('   请确保MongoDB服务已启动');
        return;
    }
    
    // 2. 检查服务器是否运行
    console.log('\n2. 检查服务器状态...');
    await checkServerStatus();
    
    // 3. 测试登录API
    console.log('\n3. 测试登录API...');
    await testLoginAPI();
    
    // 4. 如果登录失败，重新初始化数据库
    console.log('\n4. 重新初始化数据库...');
    await reinitializeDatabase();
    
    console.log('\n🎯 诊断完成！');
}

async function checkServerStatus() {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/health',
            method: 'GET',
            timeout: 5000
        };
        
        const req = http.request(options, (res) => {
            console.log(`✅ 服务器运行正常 (状态码: ${res.statusCode})`);
            resolve();
        });
        
        req.on('error', (e) => {
            console.log('❌ 服务器未运行或连接失败:', e.message);
            console.log('   请运行: node server.js 启动服务器');
            resolve();
        });
        
        req.on('timeout', () => {
            console.log('❌ 服务器连接超时，可能未启动');
            req.destroy();
            resolve();
        });
        
        req.end();
    });
}

async function testLoginAPI() {
    return new Promise((resolve) => {
        const loginData = JSON.stringify({
            username: 'testuser',
            password: '123456'
        });

        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(loginData)
            },
            timeout: 5000
        };

        const req = http.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk.toString();
            });
            
            res.on('end', () => {
                try {
                    const result = JSON.parse(responseData);
                    if (result.success) {
                        console.log('✅ 登录API测试成功');
                        console.log('   用户:', result.user.username);
                        console.log('   用户ID:', result.user.id);
                    } else {
                        console.log('❌ 登录API返回错误:', result.message);
                    }
                } catch (e) {
                    console.log('❌ 登录API响应解析失败:', e.message);
                }
                resolve();
            });
        });

        req.on('error', (e) => {
            console.log('❌ 登录API请求失败:', e.message);
            resolve();
        });
        
        req.on('timeout', () => {
            console.log('❌ 登录API请求超时');
            req.destroy();
            resolve();
        });

        req.write(loginData);
        req.end();
    });
}

async function reinitializeDatabase() {
    console.log('   重新初始化数据库...');
    try {
        const { exec } = require('child_process');
        
        exec('node initMongoDB.js', (error, stdout, stderr) => {
            if (error) {
                console.log('❌ 数据库初始化失败:', error.message);
                return;
            }
            console.log('✅ 数据库初始化完成');
            console.log('   输出:', stdout);
        });
    } catch (error) {
        console.log('❌ 执行初始化脚本失败:', error.message);
    }
}

// 执行诊断
diagnoseLogin().catch(console.error);