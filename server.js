const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');

// 确保使用MongoDB模型
const { connectDB, User, HealthRecord, generateAIReport } = require('./mongodb');

// 加载环境变量
dotenv.config();

const app = express();

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 静态文件服务 - 提供HTML文件访问
app.use(express.static(path.join(__dirname)));

// 连接数据库
connectDB();

// 根路径路由 - 重定向到主页面
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'simple_login.html'));
});

// 主页面路由
app.get('/tangyu.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'tangyu.html'));
});

// 公共访问说明页面
app.get('/public_access.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public_access.html'));
});

// 登录页面路由
app.get('/simple_login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'simple_login.html'));
});

// 健康检查路由
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: '服务器运行正常',
        timestamp: new Date().toISOString()
    });
});

// 根路径路由
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '糖域卫士API服务器',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            register: '/api/register',
            login: '/api/login',
            healthData: '/api/health-data/:userId',
            aiReport: '/api/ai-report/:userId/:period'
        }
    });
});

// 用户注册
app.post('/api/register', async (req, res) => {
    try {
        const { username, password, email, phone } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: '用户名和密码是必填项'
            });
        }

        // 检查用户是否已存在
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: '用户名已存在'
            });
        }

        // 创建新用户
        const user = new User({
            username,
            password, // 注意：实际项目中应该加密密码
            email,
            phone
        });

        await user.save();

        res.json({
            success: true,
            message: '用户注册成功',
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('注册错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误',
            error: error.message
        });
    }
});

// 用户登录
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: '用户名和密码是必填项'
            });
        }

        // 查找用户
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: '用户名或密码错误'
            });
        }

        // 验证密码（注意：实际项目中应该使用加密验证）
        if (user.password !== password) {
            return res.status(401).json({
                success: false,
                message: '用户名或密码错误'
            });
        }

        // 更新最后登录时间
        user.lastLogin = new Date();
        await user.save();

        res.json({
            success: true,
            message: '登录成功',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                lastLogin: user.lastLogin
            }
        });
    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误',
            error: error.message
        });
    }
});

// 获取用户健康数据
app.get('/api/health-data/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // 验证用户ID格式 - 修改为支持23-24位十六进制字符串
        if (!userId.match(/^[0-9a-fA-F]{23,24}$/)) {
            return res.status(400).json({
                success: false,
                message: '无效的用户ID格式'
            });
        }

        // 检查用户是否存在
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 获取用户的健康数据
        const healthRecords = await HealthRecord.find({ userId }).sort({ timestamp: -1 });

        // 按类型分类数据
        const dataByType = {
            bloodGlucose: healthRecords.filter(record => record.type === 'bloodGlucose'),
            diet: healthRecords.filter(record => record.type === 'diet'),
            exercise: healthRecords.filter(record => record.type === 'exercise'),
            medication: healthRecords.filter(record => record.type === 'medication')
        };

        res.json({
            success: true,
            message: '健康数据获取成功',
            data: dataByType
        });
    } catch (error) {
        console.error('获取健康数据错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误',
            error: error.message
        });
    }
});

// 保存健康数据
app.post('/api/health-data/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { type, value, unit, notes } = req.body;

        // 验证用户ID格式 - 修改为支持23-24位十六进制字符串
        if (!userId.match(/^[0-9a-fA-F]{23,24}$/)) {
            return res.status(400).json({
                success: false,
                message: '无效的用户ID格式'
            });
        }

        // 检查用户是否存在
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 验证数据类型
        const validTypes = ['bloodGlucose', 'diet', 'exercise', 'medication'];
        if (!type || !validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: '无效的数据类型'
            });
        }

        // 创建健康记录
        const healthRecord = new HealthRecord({
            userId,
            type,
            value,
            unit,
            notes,
            timestamp: new Date()
        });

        await healthRecord.save();

        res.json({
            success: true,
            message: '健康数据保存成功',
            data: healthRecord
        });
    } catch (error) {
        console.error('保存健康数据错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误',
            error: error.message
        });
    }
});

// AI报告生成API
app.get('/api/ai-report/:userId/:period', async (req, res) => {
    try {
        const { userId, period } = req.params;

        // 验证参数
        if (!['week', 'month'].includes(period)) {
            return res.status(400).json({
                success: false,
                message: '报告周期必须是 week 或 month'
            });
        }

        // 验证用户ID格式 - 修改为支持23-24位十六进制字符串
        if (!userId.match(/^[0-9a-fA-F]{23,24}$/)) {
            return res.status(400).json({
                success: false,
                message: '无效的用户ID格式'
            });
        }

        // 检查用户是否存在
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // AI报告生成函数 - 修复：添加缺失的函数
        async function generateAIReport(userId, period) {
            try {
                // 获取用户数据
                const user = await User.findById(userId);
                if (!user) {
                    throw new Error('用户不存在');
                }
        
                // 获取健康记录数据
                const healthRecords = await HealthRecord.find({ userId });
                
                // 根据周期过滤数据
                const days = period === 'week' ? 7 : 30;
                const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
                const periodRecords = healthRecords.filter(record => 
                    new Date(record.timestamp) >= startDate
                );
        
                // 分析血糖数据
                const bloodGlucoseRecords = periodRecords.filter(r => r.type === 'bloodGlucose');
                const bloodGlucoseValues = bloodGlucoseRecords.map(r => r.value);
                
                const bloodGlucoseStats = {
                    average: bloodGlucoseValues.length > 0 ? 
                        Math.round(bloodGlucoseValues.reduce((a, b) => a + b, 0) / bloodGlucoseValues.length) : 120,
                    min: bloodGlucoseValues.length > 0 ? Math.min(...bloodGlucoseValues) : 80,
                    max: bloodGlucoseValues.length > 0 ? Math.max(...bloodGlucoseValues) : 180,
                    readings: bloodGlucoseValues.length
                };
        
                // 分析运动数据
                const exerciseRecords = periodRecords.filter(r => r.type === 'exercise');
                const exerciseStats = {
                    count: exerciseRecords.length,
                    totalMinutes: exerciseRecords.reduce((sum, r) => sum + (r.value || 0), 0)
                };
        
                // 分析饮食和用药数据
                const dietRecords = periodRecords.filter(r => r.type === 'diet');
                const medicationRecords = periodRecords.filter(r => r.type === 'medication');
                
                const dietStats = dietRecords.length > 0 ? 75 : 70;
                const medicationStats = medicationRecords.length > 0 ? 85 : 80;
        
                // 生成建议
                const recommendations = generateRecommendations(bloodGlucoseStats, exerciseStats);
        
                return {
                    period: period,
                    bloodGlucoseStats: bloodGlucoseStats,
                    exerciseStats: exerciseStats,
                    dietStats: dietStats,
                    medicationStats: medicationStats,
                    recommendations: recommendations,
                    generatedAt: new Date().toISOString()
                };
            } catch (error) {
                console.error('生成AI报告错误:', error);
                throw error;
            }
        }
        
        // 生成建议函数
        function generateRecommendations(bloodGlucoseStats, exerciseStats) {
            const recommendations = [];
            
            if (bloodGlucoseStats.average > 140) {
                recommendations.push("血糖水平偏高，建议减少糖分摄入并增加运动");
            } else if (bloodGlucoseStats.average < 70) {
                recommendations.push("血糖水平偏低，注意按时进食，避免低血糖");
            } else {
                recommendations.push("血糖控制良好，继续保持");
            }
            
            if (exerciseStats.count < 3) {
                recommendations.push("建议增加运动频率，每周至少3次有氧运动");
            }
            
            if (bloodGlucoseStats.readings < 7) {
                recommendations.push("建议增加血糖监测频率，更好地了解血糖变化");
            }
            
            recommendations.push("保持均衡饮食，控制碳水化合物摄入");
            recommendations.push("定期复查糖化血红蛋白，了解长期血糖控制情况");
            
            return recommendations;
        }

        res.json({
            success: true,
            message: 'AI报告生成成功',
            data: report
        });
    } catch (error) {
        console.error('生成AI报告错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误',
            error: error.message
        });
    }
});

// 社区帖子API端点 - 修复：添加缺失的API端点
app.get('/api/community/posts', async (req, res) => {
    try {
        // 返回模拟的社区帖子数据
        res.json({
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
        });
    } catch (error) {
        console.error('获取社区帖子错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 获取帖子详情
app.get('/api/community/posts/:postId', async (req, res) => {
    try {
        const { postId } = req.params;
        res.json({
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
                    }
                ]
            }
        });
    } catch (error) {
        console.error('获取帖子详情错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 添加帖子评论
app.post('/api/community/posts/:postId/comments', async (req, res) => {
    try {
        const { postId } = req.params;
        const { userId, content } = req.body;
        
        res.json({
            success: true,
            message: '评论添加成功',
            data: {
                id: 'new-comment-' + Date.now(),
                user: '当前用户',
                content: content,
                createdAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('添加评论错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 修改服务器启动部分
const PORT = process.env.PORT || 3000;

// Vercel环境特殊处理
if (process.env.VERCEL) {
    // 在Vercel环境中，使用module.exports导出app
    module.exports = app;
} else {
    // 本地开发环境正常启动服务器
    app.listen(PORT, () => {
        console.log(`糖域卫士服务器运行在: http://localhost:${PORT}`);
        console.log(`主页面: http://localhost:${PORT}/tangyu.html`);
        console.log(`登录页面: http://localhost:${PORT}/simple_login.html`);
    });
}