const mongoose = require('mongoose');

// 数据库连接配置
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tangyu_guardian';

// 连接数据库
async function connectDB() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB连接成功');
    } catch (error) {
        console.error('MongoDB连接失败:', error);
        process.exit(1);
    }
}

// 用户模型
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date },
    profile: {
        name: String,
        age: Number,
        gender: String,
        diabetesType: String,
        diagnosisDate: Date
    }
});

// 健康数据模型
const healthRecordSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true, enum: ['bloodGlucose', 'diet', 'exercise', 'medication'] },
    value: { type: Number },
    unit: { type: String },
    notes: { type: String },
    timestamp: { type: Date, default: Date.now },
    metadata: { type: Object }
});

// 社区帖子模型
const postSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    type: { type: String, enum: ['question', 'experience', 'news'], default: 'experience' },
    tags: [{ type: String }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// 评论模型
const commentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

// AI报告模型
const aiReportSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    period: { type: String, enum: ['week', 'month'], required: true },
    summary: { type: Object },
    recommendations: [{ type: String }],
    generatedAt: { type: Date, default: Date.now }
});

// 创建模型（移到函数定义之前）
const User = mongoose.model('User', userSchema);
const HealthRecord = mongoose.model('HealthRecord', healthRecordSchema);
const Post = mongoose.model('Post', postSchema);
const Comment = mongoose.model('Comment', commentSchema);
const AIReport = mongoose.model('AIReport', aiReportSchema);

// AI报告生成函数，提供更完整的数据
async function generateAIReport(userId, period = 'week') {
    try {
        // 直接使用userId作为ObjectId，无需转换
        const actualUserId = userId;
        
        // 验证用户是否存在
        const user = await User.findById(actualUserId);
        if (!user) {
            throw new Error(`用户不存在: ${userId}`);
        }
        
        // 计算日期范围
        const endDate = new Date();
        const startDate = new Date();
        const days = period === 'week' ? 7 : 30;
        startDate.setDate(endDate.getDate() - days);

        // 获取用户的详细健康数据记录（合并两次查询为一次）
        const healthRecords = await HealthRecord.find({
            userId: actualUserId,
            timestamp: { $gte: startDate, $lte: endDate }
        }).sort({ timestamp: 1 });

        // 按类型分类数据
        const bgRecords = healthRecords.filter(record => record.type === 'bloodGlucose');
        const exerciseRecords = healthRecords.filter(record => record.type === 'exercise');
        const dietRecords = healthRecords.filter(record => record.type === 'diet');
        const medicationRecords = healthRecords.filter(record => record.type === 'medication');

        // 计算详细的血糖统计数据
        let bgStats = { 
            average: 0, 
            highCount: 0, 
            lowCount: 0, 
            normalCount: 0,
            records: bgRecords.length,
            // 添加更多统计指标
            minValue: bgRecords.length > 0 ? Math.min(...bgRecords.map(r => parseFloat(r.value || 0))) : 0,
            maxValue: bgRecords.length > 0 ? Math.max(...bgRecords.map(r => parseFloat(r.value || 0))) : 0,
            standardDeviation: 0
        };
        
        if (bgRecords.length > 0) {
            const values = bgRecords.map(record => parseFloat(record.value || 0));
            const total = values.reduce((sum, val) => sum + val, 0);
            bgStats.average = Math.round(total / values.length);
            
            values.forEach(value => {
                if (value < 70) bgStats.lowCount++;
                else if (value > 180) bgStats.highCount++;
                else bgStats.normalCount++;
            });
            
            // 计算标准差
            const mean = bgStats.average;
            const squareDiffs = values.map(value => Math.pow(value - mean, 2));
            bgStats.standardDeviation = Math.round(Math.sqrt(squareDiffs.reduce((sum, val) => sum + val, 0) / values.length));
        }

        // 计算运动统计数据
        let exerciseStats = { 
            count: exerciseRecords.length, 
            totalMinutes: 0,
            averageDuration: 0,
            frequencyScore: Math.min(100, exerciseRecords.length * 15) // 频率评分
        };
        
        if (exerciseRecords.length > 0) {
            const durations = exerciseRecords.map(record => parseInt(record.value || 0));
            exerciseStats.totalMinutes = durations.reduce((sum, duration) => sum + duration, 0);
            exerciseStats.averageDuration = Math.round(exerciseStats.totalMinutes / exerciseRecords.length);
        }

        // 生成个性化建议
        const recommendations = generateRecommendations(bgStats, exerciseStats, dietRecords.length, medicationRecords.length);

        // 生成完整的报告内容 - 移除所有随机数据
        const report = {
            period: period,
            generatedAt: new Date().toISOString(),
            summary: {
                bloodGlucose: bgStats,
                exercise: exerciseStats,
                diet: dietRecords.length,
                medication: medicationRecords.length,
                monitoringFrequency: Math.min(100, bgRecords.length * 10) // 基于真实数据的监测频率
            },
            recommendations: recommendations,
            // 添加原始记录用于前端图表
            bloodGlucoseRecords: bgRecords.slice(-10).map(record => ({
                value: parseFloat(record.value || 0),
                timestamp: record.timestamp
            }))
        };

        // 保存报告到数据库
        const aiReport = new AIReport({
            userId: actualUserId,
            period: period,
            summary: report.summary,
            recommendations: report.recommendations,
            generatedAt: report.generatedAt
        });
        
        await aiReport.save();

        return report;
    } catch (error) {
        console.error('生成AI报告失败:', error);
        throw error;
    }
}

// 生成个性化建议
function generateRecommendations(bgStats, exerciseStats, dietCount, medicationCount) {
    const recommendations = [];
    
    // 基于血糖数据的建议
    if (bgStats.average > 150) {
        recommendations.push('您的平均血糖值偏高，建议增加膳食纤维摄入，减少精制碳水化合物的摄入。');
    } else if (bgStats.average < 80) {
        recommendations.push('您的平均血糖值偏低，建议增加餐次或调整用药时间，避免低血糖发生。');
    } else {
        recommendations.push('您的血糖控制良好，请继续保持当前的饮食和运动习惯。');
    }
    
    if (bgStats.highCount > bgStats.normalCount) {
        recommendations.push('高血糖记录较多，建议监测餐后血糖并记录影响因素，以便调整生活方式。');
    }
    
    // 基于运动数据的建议
    if (exerciseStats.count < (exerciseStats.totalMinutes > 0 ? 3 : 5)) {
        recommendations.push('建议每周至少进行150分钟中等强度的有氧运动，如快走、游泳或骑自行车。');
    } else if (exerciseStats.totalMinutes > 300) {
        recommendations.push('您的运动量充足，请注意运动前后的血糖监测，避免运动诱发的低血糖。');
    } else {
        recommendations.push('您的运动习惯良好，请继续保持规律的运动频率和强度。');
    }
    
    // 基于饮食记录的建议
    if (dietCount < 14) {
        recommendations.push('建议增加饮食记录的频率，详细记录有助于更好地了解食物对血糖的影响。');
    } else {
        recommendations.push('您的饮食记录很规律，这有助于更好地管理血糖，建议继续保持。');
    }
    
    return recommendations;
}

module.exports = {
    connectDB,
    User,
    HealthRecord,
    Post,
    Comment,
    AIReport,
    generateAIReport
};