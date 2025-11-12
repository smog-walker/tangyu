// API客户端 - 用于前端与后端API通信（MongoDB真实数据版本）
class APIClient {
    constructor() {
        // 自动检测当前环境并设置正确的baseURL
        this.baseURL = this.getBaseURL();
        console.log('API客户端初始化，baseURL:', this.baseURL);
    }

    // 获取基础URL - 自动检测环境
    getBaseURL() {
        // 如果是Vercel部署环境，使用当前域名
        if (window.location.hostname.includes('vercel.app')) {
            return window.location.origin;
        }
        // 本地开发环境
        return 'http://localhost:3000';
    }

    // 通用请求方法
    async request(endpoint, options = {}) {
        try {
            const url = `${this.baseURL}${endpoint}`;
            console.log('API请求:', url);
            
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API请求错误:', error);
            throw error;
        }
    }

    // 用户登录 - 直接调用后端API
    async loginUser(username, password) {
        return await this.request('/api/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }

    // 用户注册 - 直接调用后端API
    async registerUser(userData) {
        return await this.request('/api/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    // 获取健康数据 - 直接从MongoDB获取真实数据
    async getHealthData(userId, period = 'all') {
        return await this.request(`/api/health-data/${userId}?period=${period}`);
    }

    // 获取AI报告 - 基于真实MongoDB数据生成报告
    async getAIReport(userId, period) {
        return await this.request(`/api/ai-report/${userId}/${period}`);
    }

    // 保存健康数据 - 保存到MongoDB
    async saveHealthData(userId, data) {
        return await this.request(`/api/health-data/${userId}`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // 健康检查
    async healthCheck() {
        return await this.request('/api/health');
    }

    // 获取社区帖子列表
    async getCommunityPosts() {
        return await this.request('/api/community/posts');
    }

    // 添加帖子评论
    async addPostComment(postId, userId, content) {
        return await this.request(`/api/community/posts/${postId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ userId, content })
        });
    }

    // 获取帖子详情
    async getPostDetail(postId) {
        return await this.request(`/api/community/posts/${postId}`);
    }

    // 获取用户信息
    async getUserInfo(userId) {
        return await this.request(`/api/users/${userId}`);
    }

    // 更新用户信息
    async updateUserInfo(userId, userData) {
        return await this.request(`/api/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    // 获取血糖趋势数据
    async getBloodGlucoseTrend(userId, days = 7) {
        return await this.request(`/api/blood-glucose/${userId}/trend?days=${days}`);
    }

    // 获取运动统计
    async getExerciseStats(userId, period = 'week') {
        return await this.request(`/api/exercise/${userId}/stats?period=${period}`);
    }

    // 获取饮食统计
    async getDietStats(userId, period = 'week') {
        return await this.request(`/api/diet/${userId}/stats?period=${period}`);
    }

    // 获取用药统计
    async getMedicationStats(userId, period = 'week') {
        return await this.request(`/api/medication/${userId}/stats?period=${period}`);
    }

    // 批量保存健康记录
    async saveHealthRecords(userId, records) {
        return await this.request(`/api/health-records/${userId}/batch`, {
            method: 'POST',
            body: JSON.stringify({ records })
        });
    }

    // 删除健康记录
    async deleteHealthRecord(userId, recordId, recordType) {
        return await this.request(`/api/health-records/${userId}/${recordType}/${recordId}`, {
            method: 'DELETE'
        });
    }

    // 获取健康提醒
    async getHealthReminders(userId) {
        return await this.request(`/api/reminders/${userId}`);
    }

    // 设置健康提醒
    async setHealthReminder(userId, reminderData) {
        return await this.request(`/api/reminders/${userId}`, {
            method: 'POST',
            body: JSON.stringify(reminderData)
        });
    }
}

// 创建全局API客户端实例
window.apiClient = new APIClient();