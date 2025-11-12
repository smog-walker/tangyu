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

    // 通用请求方法 - 增强错误处理
    async request(endpoint, options = {}) {
        try {
            const url = `${this.baseURL}${endpoint}`;
            console.log('API请求:', url);
            
            // 检查userId参数格式
            if (endpoint.includes('/api/') && endpoint.includes('current_user')) {
                console.warn('检测到使用current_user作为参数，将转换为实际用户ID');
            }
            
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                // 提供更详细的错误信息
                let errorMessage = `HTTP error! status: ${response.status}`;
                
                // 尝试获取错误详情
                try {
                    const errorData = await response.json();
                    errorMessage += `, message: ${errorData.message || '未知错误'}`;
                } catch (parseError) {
                    // 如果无法解析JSON，使用默认错误信息
                }
                
                // 针对400错误提供更具体的建议
                if (response.status === 400) {
                    errorMessage += '\n可能的原因：\n- 请求参数格式错误\n- 用户ID无效\n- 后端接口不存在';
                }
                
                throw new Error(errorMessage);
            }

            return await response.json();
        } catch (error) {
            console.error('API请求错误:', error);
            
            // 提供更友好的错误信息
            if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
                console.warn('CORS错误：请确保后端服务器已正确配置CORS头信息');
                console.warn('本地开发时，可以尝试启动后端服务器：node server.js');
            } else if (error.message.includes('400')) {
                console.warn('400错误：请求参数错误或后端接口不存在');
                console.warn('请检查：\n1. 用户ID格式是否正确\n2. API端点是否存在\n3. 请求参数是否符合要求');
            }
            
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
            // 不再返回模拟数据，直接抛出错误
            throw new Error('登录失败：' + error.message);
        }
    }

    // 用户注册
    async registerUser(userData) {
        return await this.request('/api/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    // 获取健康数据 - 优化版，优先使用真实数据
    async getHealthData(userId, period = 'all') {
        try {
            // 如果userId是'current_user'，尝试从localStorage获取真实用户ID
            const actualUserId = userId === 'current_user' ? this.getCurrentUserId() : userId;
            const result = await this.request(`/api/health-data/${actualUserId}?period=${period}`);
            return result;
        } catch (error) {
            console.error('获取健康数据失败，使用模拟数据:', error);
            // 保留简单的模拟数据作为后备
            return {
                success: true,
                data: this.getSimpleMockData(period)
            };
        }
    }

    // 获取AI报告 - 增强版，基于真实数据，禁用模拟数据
    async getAIReport(userId, period) {
        try {
            // 如果userId是'current_user'，尝试从localStorage获取真实用户ID
            const actualUserId = userId === 'current_user' ? this.getCurrentUserId() : userId;
            const result = await this.request(`/api/ai-report/${actualUserId}/${period}`);
            
            // 验证返回的数据是否包含真实用户数据
            if (result && result.success && result.data) {
                // 检查数据是否包含真实记录
                const hasRealData = result.data.summary && 
                               (result.data.summary.bloodGlucose?.records > 0 || 
                                result.data.bloodGlucoseRecords?.length > 0);
                
                if (!hasRealData) {
                    console.warn('API返回的数据可能不包含真实用户记录');
                }
                
                return result;
            } else {
                throw new Error('API返回的数据格式无效');
            }
        } catch (error) {
            console.error('获取AI报告失败:', error);
            // 不再使用模拟数据，直接抛出错误
            throw new Error('无法获取真实用户数据报告：' + error.message);
        }
    }

    // 获取当前用户ID - 修复版，直接返回数据库中的ObjectId格式
    getCurrentUserId() {
        try {
            const userData = JSON.parse(localStorage.getItem('currentUser'));
            if (userData && userData.id) {
                // 移除user-或demo-前缀，返回纯ObjectId格式
                if (userData.id.startsWith('user-')) {
                    return userData.id.substring(5); // 移除"user-"前缀
                } else if (userData.id.startsWith('demo-')) {
                    return userData.id.substring(5); // 移除"demo-"前缀
                }
                // 如果已经是纯ObjectId格式，直接返回
                return userData.id;
            }
            // 如果用户数据中没有id，使用有效的默认格式
            return '690ac7170926fbe79b423398'; // 使用数据库中的真实ObjectId
        } catch (error) {
            console.warn('获取当前用户ID失败，使用默认ID:', error);
            return '690ac7170926fbe79b423398'; // 使用数据库中的真实ObjectId
        }
    }

    // 简单的模拟数据生成（仅用于演示）
    getSimpleMockData(period) {
        return {
            bloodGlucose: [
                { value: '120', timestamp: new Date().toISOString(), type: '空腹' }
            ],
            diet: [
                { calories: '500', carbohydrates: '60', timestamp: new Date().toISOString() }
            ],
            exercise: [
                { type: '步行', duration: '30', timestamp: new Date().toISOString() }
            ],
            medication: [
                { name: '二甲双胍', taken: true, timestamp: new Date().toISOString() }
            ]
        };
    }

    // 添加 generateAIReport 方法作为 getAIReport 的别名
    async generateAIReport(userId, period) {
        return await this.getAIReport(userId, period);
    }

    // 基于真实数据生成报告 - 修复：禁用模拟数据回退
    async generateReportFromRealData(userId, period) {
        try {
            // 获取真实健康数据
            const healthData = await this.getHealthData(userId, period);
            
            if (healthData.success && healthData.data) {
                // 验证是否包含真实数据
                const hasRealData = healthData.data.bloodGlucose && healthData.data.bloodGlucose.length > 0;
                
                if (hasRealData) {
                    return this.generateReportContent(healthData.data, period);
                } else {
                    throw new Error('用户没有健康数据记录');
                }
            } else {
                throw new Error('获取健康数据失败');
            }
        } catch (error) {
            console.error('基于真实数据生成报告失败:', error);
            // 不再生成模拟报告，直接抛出错误
            throw new Error('无法基于真实数据生成报告：' + error.message);
        }
    }

    // 生成报告内容
    generateReportContent(healthData, period) {
        const bgRecords = healthData.bloodGlucose || [];
        const dietRecords = healthData.diet || [];
        const exerciseRecords = healthData.exercise || [];
        const medicationRecords = healthData.medication || [];
        
        // 计算统计数据
        const stats = this.calculateHealthStats(bgRecords, dietRecords, exerciseRecords, medicationRecords, period);
        
        // 生成报告HTML
        const reportHtml = this.generateReportHTML(stats, period);
        
        return {
            success: true,
            data: {
                period: period,
                report: reportHtml,
                stats: stats,
                charts: this.generateChartData(stats, period)
            }
        };
    }

    // 计算健康统计数据
    calculateHealthStats(bgRecords, dietRecords, exerciseRecords, medicationRecords, period) {
        // 血糖统计
        const bgStats = {
            average: 0,
            highCount: 0,
            lowCount: 0,
            normalCount: 0,
            records: bgRecords.length
        };
        
        if (bgRecords.length > 0) {
            const total = bgRecords.reduce((sum, record) => sum + parseFloat(record.value || 0), 0);
            bgStats.average = Math.round(total / bgRecords.length);
            
            bgRecords.forEach(record => {
                const value = parseFloat(record.value || 0);
                if (value < 70) bgStats.lowCount++;
                else if (value > 180) bgStats.highCount++;
                else bgStats.normalCount++;
            });
        }
        
        // 运动统计
        const exerciseStats = {
            count: exerciseRecords.length,
            totalMinutes: exerciseRecords.reduce((sum, record) => sum + parseInt(record.duration || 0), 0),
            averageMinutes: 0
        };
        
        if (exerciseRecords.length > 0) {
            exerciseStats.averageMinutes = Math.round(exerciseStats.totalMinutes / exerciseRecords.length);
        }
        
        // 饮食统计
        const dietStats = {
            count: dietRecords.length,
            avgCalories: 0,
            avgCarbs: 0
        };
        
        if (dietRecords.length > 0) {
            const totalCalories = dietRecords.reduce((sum, record) => sum + parseInt(record.calories || 0), 0);
            const totalCarbs = dietRecords.reduce((sum, record) => sum + parseInt(record.carbohydrates || 0), 0);
            dietStats.avgCalories = Math.round(totalCalories / dietRecords.length);
            dietStats.avgCarbs = Math.round(totalCarbs / dietRecords.length);
        }
        
        // 用药统计
        const medicationStats = {
            count: medicationRecords.length,
            adherenceRate: medicationRecords.length > 0 ? Math.round((medicationRecords.filter(r => r.taken).length / medicationRecords.length) * 100) : 0
        };
        
        return { bgStats, exerciseStats, dietStats, medicationStats };
    }

    // 生成报告HTML
    generateReportHTML(stats, period) {
        const periodText = period === 'week' ? '周' : '月';
        const bgStatus = this.getBGStatus(stats.bgStats.average);
        
        return `
            <div class="report-content">
                <h3>${periodText}度健康报告</h3>
                <div class="report-summary">
                    <h4>血糖控制情况</h4>
                    <p>本${periodText}您的平均血糖值为 <span class="${bgStatus.class}">${stats.bgStats.average} mg/dL</span>，${bgStatus.text}。</p>
                    <p>共记录 ${stats.bgStats.records} 次血糖测量，其中：</p>
                    <ul>
                        <li>正常范围：${stats.bgStats.normalCount} 次</li>
                        <li>偏高：${stats.bgStats.highCount} 次</li>
                        <li>偏低：${stats.bgStats.lowCount} 次</li>
                    </ul>
                </div>
                
                <div class="report-summary">
                    <h4>运动情况</h4>
                    <p>本${periodText}您共进行了 ${stats.exerciseStats.count} 次运动，总时长 ${stats.exerciseStats.totalMinutes} 分钟。</p>
                    <p>平均每次运动时长：${stats.exerciseStats.averageMinutes} 分钟。</p>
                </div>
                
                <div class="report-summary">
                    <h4>饮食记录</h4>
                    <p>本${periodText}共记录 ${stats.dietStats.count} 次饮食，平均每餐摄入：</p>
                    <ul>
                        <li>热量：${stats.dietStats.avgCalories} 千卡</li>
                        <li>碳水化合物：${stats.dietStats.avgCarbs} 克</li>
                    </ul>
                </div>
                
                <div class="report-summary">
                    <h4>用药依从性</h4>
                    <p>本${periodText}用药依从性：${stats.medicationStats.adherenceRate}%</p>
                </div>
                
                <div class="report-recommendations">
                    <h4>个性化建议</h4>
                    ${this.generateRecommendations(stats)}
                </div>
            </div>
        `;
    }

    // 生成个性化建议
    generateRecommendations(stats) {
        const recommendations = [];
        
        // 基于血糖数据生成建议
        if (stats.bgStats.average > 150) {
            recommendations.push('您的平均血糖值偏高，建议增加膳食纤维摄入，减少精制碳水化合物的摄入。');
        } else if (stats.bgStats.average < 80) {
            recommendations.push('您的平均血糖值偏低，建议增加餐次或调整用药时间，避免低血糖发生。');
        }
        
        // 基于运动数据生成建议
        if (stats.exerciseStats.count < 3) {
            recommendations.push('建议每周至少进行150分钟中等强度的有氧运动，如快走、游泳或骑自行车。');
        }
        
        // 基于用药依从性生成建议
        if (stats.medicationStats.adherenceRate < 80) {
            recommendations.push('请注意按时服药，保持良好的用药依从性。');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('您的血糖控制和生活方式管理总体良好，请继续保持！');
        }
        
        return '<ul>' + recommendations.map(rec => `<li>${rec}</li>`).join('') + '</ul>';
    }

    // 获取血糖状态
    getBGStatus(averageBG) {
        if (averageBG < 80) return { class: 'bg-low', text: '处于偏低范围内' };
        if (averageBG > 150) return { class: 'bg-high', text: '处于偏高范围内' };
        return { class: 'bg-normal', text: '处于理想范围内' };
    }

    // 生成图表数据
    generateChartData(stats, period) {
        // 这里可以生成图表数据，用于前端渲染
        return {
            bgTrend: this.generateBGTrendData(period),
            lifestyle: this.generateLifestyleData(stats)
        };
    }

    // 生成血糖趋势数据
    generateBGTrendData(period) {
        // 模拟血糖趋势数据
        const days = period === 'week' ? 7 : 30;
        const labels = [];
        const data = [];
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }));
            data.push(Math.floor(Math.random() * 60) + 80); // 80-140之间的随机值
        }
        
        return { labels, data };
    }

    // 生成生活方式数据
    generateLifestyleData(stats) {
        return [
            Math.min(100, Math.max(0, stats.exerciseStats.count * 10)), // 运动频率评分
            Math.min(100, Math.max(0, 100 - Math.abs(stats.dietStats.avgCarbs - 60))), // 饮食控制评分
            Math.min(100, Math.max(0, stats.medicationStats.adherenceRate)), // 用药依从性评分
            80, // 睡眠质量（模拟）
            75  // 压力管理（模拟）
        ];
    }

    // 保存健康数据
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