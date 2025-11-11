// 详细测试AI报告API响应的脚本
const http = require('http');

// 测试周报API
function testWeeklyReport() {
    console.log('\n测试周报API:');
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
            console.log('HTTP状态码:', res.statusCode);
            console.log('响应头:', res.headers);
            console.log('响应体(JSON格式):', data);
            
            try {
                const jsonData = JSON.parse(data);
                console.log('解析后的响应对象:', jsonData);
                console.log('success字段:', jsonData.success);
                console.log('data字段类型:', typeof jsonData.data);
                console.log('data字段内容:', jsonData.data);
            } catch (error) {
                console.error('解析JSON失败:', error);
            }
        });
    });

    req.on('error', (error) => {
        console.error('请求失败:', error);
    });

    req.end();
}

// 测试月报API
function testMonthlyReport() {
    console.log('\n测试月报API:');
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
            console.log('HTTP状态码:', res.statusCode);
            console.log('响应头:', res.headers);
            console.log('响应体(JSON格式):', data);
            
            try {
                const jsonData = JSON.parse(data);
                console.log('解析后的响应对象:', jsonData);
                console.log('success字段:', jsonData.success);
                console.log('data字段类型:', typeof jsonData.data);
                console.log('data字段内容:', jsonData.data);
            } catch (error) {
                console.error('解析JSON失败:', error);
            }
        });
    });

    req.on('error', (error) => {
        console.error('请求失败:', error);
    });

    req.end();
}

// 执行测试
console.log('开始详细测试AI报告API响应...');
testWeeklyReport();

// 延迟执行月报测试，确保周报测试先完成
setTimeout(() => {
    testMonthlyReport();
}, 2000);