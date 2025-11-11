// API测试工具
class APITester {
    constructor() {
        this.apiClient = window.apiClient;
    }

    // 测试服务器连接
    async testConnection() {
        try {
            const result = await this.apiClient.healthCheck();
            console.log('服务器连接测试:', result);
            return result.success;
        } catch (error) {
            console.error('服务器连接测试失败:', error);
            return false;
        }
    }

    // 测试用户登录
    async testLogin(username = 'testuser', password = 'testpass') {
        try {
            const result = await this.apiClient.loginUser(username, password);
            console.log('用户登录测试:', result);
            return result.success;
        } catch (error) {
            console.error('用户登录测试失败:', error);
            return false;
        }
    }

    // 测试健康数据获取
    async testHealthData(userId = 'demo-user-123') {
        try {
            const result = await this.apiClient.getHealthData(userId);
            console.log('健康数据获取测试:', result);
            return result.success;
        } catch (error) {
            console.error('健康数据获取测试失败:', error);
            return false;
        }
    }

    // 测试AI报告生成
    async testAIReport(userId = 'demo-user-123', period = 'week') {
        try {
            const result = await this.apiClient.getAIReport(userId, period);
            console.log('AI报告生成测试:', result);
            return result.success;
        } catch (error) {
            console.error('AI报告生成测试失败:', error);
            return false;
        }
    }

    // 运行完整测试套件
    async runAllTests() {
        console.log('开始API测试套件...');
        
        const tests = [
            { name: '服务器连接', test: () => this.testConnection() },
            { name: '用户登录', test: () => this.testLogin() },
            { name: '健康数据获取', test: () => this.testHealthData() },
            { name: 'AI报告生成', test: () => this.testAIReport() }
        ];

        let passed = 0;
        let failed = 0;

        for (const test of tests) {
            console.log(`\n=== 测试: ${test.name} ===`);
            const success = await test.test();
            if (success) {
                console.log(`✅ ${test.name} - 通过`);
                passed++;
            } else {
                console.log(`❌ ${test.name} - 失败`);
                failed++;
            }
        }

        console.log(`\n=== 测试结果 ===`);
        console.log(`✅ 通过: ${passed}`);
        console.log(`❌ 失败: ${failed}`);
        console.log(`📊 成功率: ${((passed / tests.length) * 100).toFixed(1)}%`);

        return passed === tests.length;
    }
}

// 创建全局API测试器实例
window.apiTester = new APITester();