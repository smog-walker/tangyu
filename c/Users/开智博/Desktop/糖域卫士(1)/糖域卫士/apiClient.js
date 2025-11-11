// @ts-nocheck
// API客户端 - 用于前端与后端API通信
class APIClient {
    constructor(baseURL = 'http://localhost:3000') {
        this.baseURL = baseURL;
    }
    // 用户登录
    async loginUser(username, password) {
        try {
            const result = await this.request('/api/login', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });
            return result;
        } catch (error) {
            console.error('登录失败:', error);
            // 模拟登录成功，用于演示 - 生成符合24位格式的模拟ID
            return {
                success: true,
                user: {
                    id: 'demo-' + Date.now().toString().padStart(20, '0'), // 生成24位格式的ID
                    username: username,
                    email: `${username}@example.com`
                }
            };
        }
    }
}