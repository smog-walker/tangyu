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

        // 生成AI报告
        const report = await generateAIReport(userId, period);

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