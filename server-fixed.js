// 修复版的服务器文件 - 统一使用MongoDB
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { connectDB, User, HealthRecord, Post, Comment, AIReport, generateAIReport } = require('./mongodb');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// 连接数据库
connectDB();

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static(__dirname));

// API 路由

// 用户注册
app.post('/api/register', async (req, res) => {
    const { username, password, email } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: '请输入用户名和密码'
        });
    }

    try {
        // 检查用户是否已存在
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: '用户名已存在'
            });
        }

        // 创建新用户
        const newUser = new User({
            username,
            password, // 注意：这里需要添加密码加密逻辑
            email
        });

        await newUser.save();

        res.status(201).json({
            success: true,
            message: '注册成功',
            user: {
                id: newUser._id,
                username: newUser.username
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '注册失败',
            error: error.message
        });
    }
});

// 用户登录
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 验证密码（需要添加密码验证逻辑）
        // const isMatch = await bcrypt.compare(password, user.password);
        
        res.json({
            success: true,
            message: '登录成功',
            user: {
                id: user._id,
                username: user.username
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '登录失败',
            error: error.message
        });
    }
});

// 获取用户健康数据 - 修复版，使用MongoDB
app.get('/api/health-data/:userId', async (req, res) => {
    const { userId } = req.params;
    const type = req.query.type;
    
    // 验证userId是否为有效的ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
            success: false,
            message: '无效的用户ID格式'
        });
    }
    
    try {
        const userObjectId = new mongoose.Types.ObjectId(userId);
        
        if (type) {
            // 获取特定类型的健康数据
            const records = await HealthRecord.find({ 
                userId: userObjectId, 
                type: type 
            }).sort({ timestamp: -1 });
            
            res.json({ success: true, data: records });
        } else {
            // 获取所有健康数据
            const records = await HealthRecord.find({ 
                userId: userObjectId 
            }).sort({ timestamp: -1 });
            
            res.json({ success: true, data: records });
        }
    } catch (error) {
        console.error('获取健康数据失败:', error);
        res.status(500).json({ 
            success: false, 
            message: '获取健康数据失败', 
            error: error.message 
        });
    }
});

// 保存用户健康数据 - 修复版，使用MongoDB
app.post('/api/health-data/:userId/:type', async (req, res) => {
    const { userId, type } = req.params;
    const record = req.body;
    
    if (!userId || !type || !record) {
        return res.status(400).json({ success: false, message: '参数不完整' });
    }
    
    // 验证userId是否为有效的ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
            success: false,
            message: '无效的用户ID格式'
        });
    }
    
    try {
        const userObjectId = new mongoose.Types.ObjectId(userId);
        
        // 检查用户是否存在
        const user = await User.findById(userObjectId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        // 创建健康记录
        const newRecord = new HealthRecord({
            userId: userObjectId,
            type: type,
            value: record.value,
            unit: record.unit,
            notes: record.notes,
            timestamp: record.timestamp || new Date()
        });
        
        const savedRecord = await newRecord.save();
        
        res.status(201).json({ 
            success: true, 
            message: '健康数据保存成功',
            data: savedRecord 
        });
    } catch (error) {
        console.error('保存健康数据失败:', error);
        res.status(500).json({ 
            success: false, 
            message: '保存健康数据失败', 
            error: error.message 
        });
    }
});

// 生成AI分析报告 - 修复版，添加用户验证
app.get('/api/ai-report/:userId/:period', async (req, res) => {
    const { userId, period } = req.params;
    
    if (!userId || (period !== 'week' && period !== 'month')) {
        return res.status(400).json({ 
            success: false, 
            message: '参数不完整或无效' 
        });
    }
    
    // 验证userId是否为有效的ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
            success: false,
            message: '无效的用户ID格式'
        });
    }
    
    try {
        const userObjectId = new mongoose.Types.ObjectId(userId);
        
        // 检查用户是否存在
        const user = await User.findById(userObjectId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        // 使用MongoDB版本的AI报告生成
        const report = await generateAIReport(userObjectId, period);
        res.json({ success: true, data: report });
    } catch (error) {
        console.error('生成AI报告失败:', error);
        res.status(500).json({ 
            success: false, 
            message: '生成报告失败', 
            error: error.message 
        });
    }
});

// 首页路由
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/tangyu.html');
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`修复版服务器运行在 http://localhost:${PORT}`);
    console.log('✅ 服务器已统一使用MongoDB处理所有API请求');
});

// 其他API接口可以继续添加，但需要统一使用MongoDB