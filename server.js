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
        let user = await User.findOne({ username });
        
        // 如果用户不存在，自动创建新用户
        if (!user) {
            console.log(`用户 ${username} 不存在，自动创建新用户`);
            user = new User({
                username: username,
                password: password, // 注意：实际项目中应该加密
                email: username + '@example.com',
                lastLogin: new Date()
            });
            await user.save();
            console.log(`新用户创建成功，ID: ${user._id}`);
        } else {
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
        }

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

        // 修改用户ID验证逻辑：支持多种格式
        // 1. MongoDB ObjectId格式 (23-24位十六进制)
        // 2. 前端生成的demo-xxx格式
        // 3. 前端生成的user-xxx格式
        const isValidUserId = userId.match(/^[0-9a-fA-F]{23,24}$/) || 
                             userId.startsWith('demo-') || 
                             userId.startsWith('user-');
        
        if (!isValidUserId) {
            return res.status(400).json({
                success: false,
                message: '无效的用户ID格式'
            });
        }

        // 检查用户是否存在 - 修改为支持多种ID格式
        let user;
        if (userId.match(/^[0-9a-fA-F]{23,24}$/)) {
            // MongoDB ObjectId格式
            user = await User.findById(userId);
        } else {
            // 前端生成的ID格式，查找匹配的用户名
            const username = userId.replace(/^(demo-|user-)/, '');
            user = await User.findOne({ 
                $or: [
                    { username: username },
                    { _id: userId } // 也尝试作为ObjectId查询
                ]
            });
        }
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 获取用户的健康数据 - 使用找到的用户ID
        const actualUserId = user._id;
        const healthRecords = await HealthRecord.find({ userId: actualUserId }).sort({ timestamp: -1 });

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

        // 修改用户ID验证逻辑：支持多种格式
        const isValidUserId = userId.match(/^[0-9a-fA-F]{23,24}$/) || 
                             userId.startsWith('demo-') || 
                             userId.startsWith('user-');
        
        if (!isValidUserId) {
            return res.status(400).json({
                success: false,
                message: '无效的用户ID格式'
            });
        }

        // 检查用户是否存在 - 修改为支持多种ID格式
        let user;
        if (userId.match(/^[0-9a-fA-F]{23,24}$/)) {
            user = await User.findById(userId);
        } else {
            const username = userId.replace(/^(demo-|user-)/, '');
            user = await User.findOne({ 
                $or: [
                    { username: username },
                    { _id: userId }
                ]
            });
        }
        
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

        // 创建健康记录 - 使用实际的用户ID
        const actualUserId = user._id;
        const healthRecord = new HealthRecord({
            userId: actualUserId,
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

// AI报告生成API - 增强：确保返回真实数据
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

        // 修改用户ID验证逻辑：支持多种格式
        const isValidUserId = userId.match(/^[0-9a-fA-F]{23,24}$/) || 
                             userId.startsWith('demo-') || 
                             userId.startsWith('user-');
        
        if (!isValidUserId) {
            return res.status(400).json({
                success: false,
                message: '无效的用户ID格式'
            });
        }

        // 检查用户是否存在 - 修改为支持多种ID格式
        let user;
        if (userId.match(/^[0-9a-fA-F]{23,24}$/)) {
            user = await User.findById(userId);
        } else {
            const username = userId.replace(/^(demo-|user-)/, '');
            user = await User.findOne({ 
                $or: [
                    { username: username },
                    { _id: userId }
                ]
            });
        }
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 使用实际的用户ID生成报告
        const actualUserId = user._id;
        const report = await generateAIReport(actualUserId, period);
        
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