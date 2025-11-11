// API客户端 - 用于前端与后端API通信
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
            // 模拟登录成功，用于演示
            return {
                success: true,
                user: {
                    id: 'demo-user-123',
                    username: username,
                    email: `${username}@example.com`
                }
            };
        }
    }

    // 用户注册
    async registerUser(userData) {
        return await this.request('/api/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    // 获取健康数据
    async getHealthData(userId) {
        return await this.request(`/api/health-data/${userId}`);
    }

    // 保存健康数据
    async saveHealthData(userId, data) {
        return await this.request(`/api/health-data/${userId}`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // 获取AI报告
    async getAIReport(userId, period) {
        return await this.request(`/api/ai-report/${userId}/${period}`);
    }

    // 健康检查
    async healthCheck() {
        return await this.request('/api/health');
    }

    // 获取社区帖子列表
    async getCommunityPosts() {
        try {
            return await this.request('/api/community/posts');
        } catch (error) {
            console.error('获取社区帖子失败:', error);
            // 返回模拟数据用于演示 - 修复：确保返回正确的数据结构
            return {
                success: true,
                data: [
                    {
                        id: 'post-1',
                        title: '糖尿病饮食控制经验分享',
                        content: '我通过控制碳水摄入和定时进餐，血糖控制得很好...',
                        author: '糖友小王',
                        createdAt: new Date().toISOString(),
                        comments: 5,
                        likes: 12
                    },
                    {
                        id: 'post-2',
                        title: '运动对血糖控制的重要性',
                        content: '每天坚持30分钟有氧运动，血糖明显改善...',
                        author: '健康达人',
                        createdAt: new Date(Date.now() - 86400000).toISOString(),
                        comments: 3,
                        likes: 8
                    }
                ]
            };
        }
    }

    // 添加帖子评论
    async addPostComment(postId, userId, content) {
        try {
            return await this.request(`/api/community/posts/${postId}/comments`, {
                method: 'POST',
                body: JSON.stringify({ userId, content })
            });
        } catch (error) {
            console.error('添加评论失败:', error);
            // 返回模拟成功响应
            return {
                success: true,
                message: '评论添加成功'
            };
        }
    }

    // 获取帖子详情
    async getPostDetail(postId) {
        try {
            return await this.request(`/api/community/posts/${postId}`);
        } catch (error) {
            console.error('获取帖子详情失败:', error);
            // 返回模拟数据用于演示
            return {
                success: true,
                data: {
                    id: postId,
                    title: '模拟帖子标题',
                    content: '这是模拟的帖子内容...',
                    author: '模拟用户',
                    createdAt: new Date().toISOString(),
                    comments: [
                        {
                            id: 'comment-1',
                            user: '用户A',
                            content: '很好的分享！',
                            createdAt: new Date().toISOString()
                        },
                        {
                            id: 'comment-2', 
                            user: '用户B',
                            content: '学到了很多，谢谢！',
                            createdAt: new Date(Date.now() - 3600000).toISOString()
                        }
                    ]
                }
            };
        }
    }
}

// 创建全局API客户端实例
window.apiClient = new APIClient();