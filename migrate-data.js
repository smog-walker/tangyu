const mongoose = require('mongoose');

// 数据库连接配置 - 修正Atlas连接字符串
const LOCAL_DB_URI = 'mongodb://localhost:27017/tangyu_guardian';
const ATLAS_DB_URI = 'mongodb+srv://vercel_app:smog123456@cluster0.ihsrdnh.mongodb.net/tangyu_guardian?retryWrites=true&w=majority';

// 数据库模型定义（与mongodb.js保持一致）
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

const healthRecordSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true, enum: ['bloodGlucose', 'diet', 'exercise', 'medication'] },
    value: { type: Number },
    unit: { type: String },
    notes: { type: String },
    timestamp: { type: Date, default: Date.now },
    metadata: { type: Object }
});

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

const commentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const aiReportSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    period: { type: String, enum: ['week', 'month'], required: true },
    summary: { type: Object },
    recommendations: [{ type: String }],
    generatedAt: { type: Date, default: Date.now }
});

async function migrateData() {
    let localConn, atlasConn;
    
    try {
        console.log('🚀 开始数据迁移...');
        
        // 连接本地数据库
        console.log('📡 连接本地数据库...');
        localConn = await mongoose.createConnection(LOCAL_DB_URI).asPromise();
        console.log('✅ 本地数据库连接成功');
        
        // 连接Atlas数据库
        console.log('☁️ 连接MongoDB Atlas...');
        atlasConn = await mongoose.createConnection(ATLAS_DB_URI).asPromise();
        console.log('✅ Atlas数据库连接成功');
        
        // 创建模型
        const LocalUser = localConn.model('User', userSchema);
        const LocalHealthRecord = localConn.model('HealthRecord', healthRecordSchema);
        const LocalPost = localConn.model('Post', postSchema);
        const LocalComment = localConn.model('Comment', commentSchema);
        const LocalAIReport = localConn.model('AIReport', aiReportSchema);
        
        const AtlasUser = atlasConn.model('User', userSchema);
        const AtlasHealthRecord = atlasConn.model('HealthRecord', healthRecordSchema);
        const AtlasPost = atlasConn.model('Post', postSchema);
        const AtlasComment = atlasConn.model('Comment', commentSchema);
        const AtlasAIReport = atlasConn.model('AIReport', aiReportSchema);
        
        // 初始化统计变量
        let validPostsCount = 0;
        let invalidPostsCount = 0;
        let validCommentsCount = 0;
        let invalidCommentsCount = 0;
        let validAIReportsCount = 0;
        let invalidAIReportsCount = 0;
        
        // 迁移用户数据
        console.log('👥 迁移用户数据...');
        const localUsers = await LocalUser.find({});
        if (localUsers.length > 0) {
            await AtlasUser.deleteMany({}); // 清空目标表
            await AtlasUser.insertMany(localUsers);
            console.log(`✅ 迁移 ${localUsers.length} 个用户`);
        }
        
        // 迁移健康记录
        console.log('📊 迁移健康记录...');
        const localHealthRecords = await LocalHealthRecord.find({});
        if (localHealthRecords.length > 0) {
            await AtlasHealthRecord.deleteMany({});
            await AtlasHealthRecord.insertMany(localHealthRecords);
            console.log(`✅ 迁移 ${localHealthRecords.length} 条健康记录`);
        }
        
        // 迁移帖子 - 修复缺失userId的问题
        console.log('💬 迁移社区帖子...');
        const localPosts = await LocalPost.find({});
        if (localPosts.length > 0) {
            await AtlasPost.deleteMany({});
            
            // 过滤掉userId为null或undefined的帖子
            const validPosts = localPosts.filter(post => post.userId != null);
            const invalidPosts = localPosts.filter(post => post.userId == null);
            
            validPostsCount = validPosts.length;
            invalidPostsCount = invalidPosts.length;
            
            if (validPosts.length > 0) {
                await AtlasPost.insertMany(validPosts);
                console.log(`✅ 迁移 ${validPosts.length} 个有效帖子`);
            }
            
            if (invalidPosts.length > 0) {
                console.log(`⚠️ 跳过 ${invalidPosts.length} 个无效帖子（缺失userId）`);
                console.log('📝 无效帖子ID:', invalidPosts.map(p => p._id));
            }
        }
        
        // 迁移评论 - 同样处理缺失userId的问题
        console.log('💭 迁移评论...');
        const localComments = await LocalComment.find({});
        if (localComments.length > 0) {
            await AtlasComment.deleteMany({});
            
            const validComments = localComments.filter(comment => comment.userId != null && comment.postId != null);
            const invalidComments = localComments.filter(comment => comment.userId == null || comment.postId == null);
            
            validCommentsCount = validComments.length;
            invalidCommentsCount = invalidComments.length;
            
            if (validComments.length > 0) {
                await AtlasComment.insertMany(validComments);
                console.log(`✅ 迁移 ${validComments.length} 条有效评论`);
            }
            
            if (invalidComments.length > 0) {
                console.log(`⚠️ 跳过 ${invalidComments.length} 条无效评论（缺失userId或postId）`);
            }
        }
        
        // 迁移AI报告
        console.log('🤖 迁移AI报告...');
        const localAIReports = await LocalAIReport.find({});
        if (localAIReports.length > 0) {
            await AtlasAIReport.deleteMany({});
            
            const validAIReports = localAIReports.filter(report => report.userId != null);
            const invalidAIReports = localAIReports.filter(report => report.userId == null);
            
            validAIReportsCount = validAIReports.length;
            invalidAIReportsCount = invalidAIReports.length;
            
            if (validAIReports.length > 0) {
                await AtlasAIReport.insertMany(validAIReports);
                console.log(`✅ 迁移 ${validAIReports.length} 份有效AI报告`);
            }
            
            if (invalidAIReports.length > 0) {
                console.log(`⚠️ 跳过 ${invalidAIReports.length} 份无效AI报告（缺失userId）`);
            }
        }
        
        console.log('🎉 数据迁移完成！');
        console.log('📊 迁移统计:');
        console.log(`   - 用户: ${localUsers.length}`);
        console.log(`   - 健康记录: ${localHealthRecords.length}`);
        console.log(`   - 帖子: ${validPostsCount}（跳过${invalidPostsCount}个无效帖子）`);
        console.log(`   - 评论: ${validCommentsCount}（跳过${invalidCommentsCount}条无效评论）`);
        console.log(`   - AI报告: ${validAIReportsCount}（跳过${invalidAIReportsCount}份无效报告）`);
        
    } catch (error) {
        console.error('❌ 迁移失败:', error);
    } finally {
        // 关闭连接
        if (localConn) await localConn.close();
        if (atlasConn) await atlasConn.close();
        console.log('🔌 数据库连接已关闭');
    }
}

// 运行迁移
migrateData().then(() => {
    console.log('🏁 迁移脚本执行完成');
    process.exit(0);
}).catch(error => {
    console.error('💥 脚本执行失败:', error);
    process.exit(1);
});