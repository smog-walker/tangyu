const http = require('http');

// 测试周报API
function testWeeklyReport() {
    console.log('开始测试周报API...');
    
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/ai-report/current_user/week',
        method: 'GET'
    };
    
    const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const result = JSON.parse(data);
                console.log('周报API响应:', result);
                if (result.success) {
                    console.log('✅ 周报API调用成功');
                } else {
                    console.error('❌ 周报API返回失败:', result.message);
                }
            } catch (error) {
                console.error('❌ 解析周报API响应失败:', error);
                console.error('原始响应:', data);
            }
        });
    });
    
    req.on('error', (error) => {
        console.error('❌ 周报API请求失败:', error);
    });
    
    req.end();
}

// 测试月报API
function testMonthlyReport() {
    console.log('\n开始测试月报API...');
    
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/ai-report/current_user/month',
        method: 'GET'
    };
    
    const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const result = JSON.parse(data);
                console.log('月报API响应:', result);
                if (result.success) {
                    console.log('✅ 月报API调用成功');
                } else {
                    console.error('❌ 月报API返回失败:', result.message);
                }
            } catch (error) {
                console.error('❌ 解析月报API响应失败:', error);
                console.error('原始响应:', data);
            }
        });
    });
    
    req.on('error', (error) => {
        console.error('❌ 月报API请求失败:', error);
    });
    
    req.end();
}

// 运行测试
console.log('===== AI报告API测试 =====');
testWeeklyReport();
// 延迟测试月报API，避免请求过于密集
setTimeout(testMonthlyReport, 1000);