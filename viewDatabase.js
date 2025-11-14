const { connectDB, User, HealthRecord, AIReport, Post, Comment } = require('./mongodb');

async function viewDatabase() {
    try {
        console.log('🔍 正在查看数据库中的所有数据...');
        await connectDB();
        
        // 1. 查看用户数据
        console.log('\n👥 ========== 用户数据 ==========');
        const users = await User.find({});
        console.log(`总用户数: ${users.length}`);
        
        if (users.length > 0) {
            users.forEach((user, index) => {
                console.log(`\n${index + 1}. ${user.username} (ID: ${user._id})`);
                console.log(`   邮箱: ${user.email || '未设置'}`);
                console.log(`   电话: ${user.phone || '未设置'}`);
                console.log(`   创建时间: ${user.createdAt}`);
                console.log(`   最后登录: ${user.lastLogin || '从未登录'}`);
                if (user.profile) {
                    console.log(`   个人信息: ${user.profile.name || '未设置'}, ${user.profile.age || '未知年龄'}, ${user.profile.gender || '未知性别'}`);
                }
            });
        }

        // 2. 查看健康记录数据
        console.log('\n📊 ========== 健康记录数据 ==========');
        const healthRecords = await HealthRecord.find({}).populate('userId', 'username');
        console.log(`总健康记录数: ${healthRecords.length}`);
        
        // 按类型统计
        const recordsByType = {};
        healthRecords.forEach(record => {
            if (!recordsByType[record.type]) {
                recordsByType[record.type] = [];
            }
            recordsByType[record.type].push(record);
        });
        
        Object.keys(recordsByType).forEach(type => {
            console.log(`\n${type} 记录数: ${recordsByType[type].length}`);
            recordsByType[type].slice(0, 5).forEach((record, index) => {
                console.log(`   ${index + 1}. 用户: ${record.userId?.username || '未知'}, 值: ${record.value}${record.unit || ''}, 时间: ${record.timestamp}`);
                if (record.notes) {
                    console.log(`      备注: ${record.notes}`);
                }
            });
            if (recordsByType[type].length > 5) {
                console.log(`   ... 还有 ${recordsByType[type].length - 5} 条记录`);
            }
        });

        // 3. 查看AI报告数据
        console.log('\n🤖 ========== AI报告数据 ==========');
        const aiReports = await AIReport.find({}).populate('userId', 'username');
        console.log(`总AI报告数: ${aiReports.length}`);
        
        if (aiReports.length > 0) {
            aiReports.forEach((report, index) => {
                console.log(`\n${index + 1}. ${report.userId?.username || '未知用户'} - ${report.period}报告`);
                console.log(`   生成时间: ${report.generatedAt}`);
                console.log(`   血糖记录数: ${report.summary?.bloodGlucose?.records || 0}`);
                console.log(`   运动记录数: ${report.summary?.exercise?.count || 0}`);
                console.log(`   饮食记录数: ${report.summary?.diet || 0}`);
                console.log(`   用药记录数: ${report.summary?.medication || 0}`);
                if (report.recommendations && report.recommendations.length > 0) {
                    console.log(`   建议数量: ${report.recommendations.length}`);
                }
            });
        }

        // 4. 查看社区数据
        console.log('\n💬 ========== 社区数据 ==========');
        const posts = await Post.find({}).populate('userId', 'username');
        const comments = await Comment.find({}).populate('userId', 'username');
        
        console.log(`帖子数量: ${posts.length}`);
        console.log(`评论数量: ${comments.length}`);
        
        if (posts.length > 0) {
            console.log('\n最新帖子:');
            posts.slice(0, 3).forEach((post, index) => {
                console.log(`   ${index + 1}. ${post.title} (${post.type})`);
                console.log(`      作者: ${post.userId?.username || '未知'}, 时间: ${post.createdAt}`);
            });
        }

        // 5. 数据统计摘要
        console.log('\n📈 ========== 数据统计摘要 ==========');
        console.log(`总用户数: ${users.length}`);
        console.log(`总健康记录数: ${healthRecords.length}`);
        console.log(`总AI报告数: ${aiReports.length}`);
        console.log(`总帖子数: ${posts.length}`);
        console.log(`总评论数: ${comments.length}`);
        
        // 按健康记录类型统计
        console.log('\n健康记录类型分布:');
        Object.keys(recordsByType).forEach(type => {
            const count = recordsByType[type].length;
            const percentage = ((count / healthRecords.length) * 100).toFixed(1);
            console.log(`   ${type}: ${count} 条 (${percentage}%)`);
        });

        // 6. 最近活动统计
        console.log('\n🕒 ========== 最近活动统计 ==========');
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const recentHealthRecords = await HealthRecord.countDocuments({
            timestamp: { $gte: oneWeekAgo }
        });
        const recentAIReports = await AIReport.countDocuments({
            generatedAt: { $gte: oneWeekAgo }
        });
        
        console.log(`最近7天新增健康记录: ${recentHealthRecords}`);
        console.log(`最近7天生成AI报告: ${recentAIReports}`);
        
    } catch (error) {
        console.error('❌ 查看数据库失败:', error);
        console.log('💡 可能的原因:');
        console.log('   1. MongoDB服务未启动');
        console.log('   2. 数据库连接配置错误');
        console.log('   3. 数据库不存在');
    } finally {
        const mongoose = require('mongoose');
        await mongoose.connection.close();
    }
}

// 支持命令行参数
const args = process.argv.slice(2);
const command = args[0];

if (command === 'users') {
    // 只查看用户数据
    viewUsersOnly();
} else if (command === 'health') {
    // 只查看健康记录
    viewHealthRecordsOnly();
} else if (command === 'reports') {
    // 只查看AI报告
    viewAIReportsOnly();
} else {
    // 查看所有数据
    viewDatabase().then(() => {
        console.log('\n✅ 数据库查看完成！');
        process.exit(0);
    });
}

async function viewUsersOnly() {
    try {
        await connectDB();
        const users = await User.find({});
        console.log('👥 用户数据:');
        users.forEach(user => {
            console.log(`   ${user.username} (${user._id}) - ${user.email || '无邮箱'}`);
        });
    } catch (error) {
        console.error('查看用户数据失败:', error);
    } finally {
        const mongoose = require('mongoose');
        await mongoose.connection.close();
    }
}

async function viewHealthRecordsOnly() {
    try {
        await connectDB();
        const records = await HealthRecord.find({}).populate('userId', 'username');
        console.log('📊 健康记录数据:');
        records.forEach(record => {
            console.log(`   ${record.userId?.username} - ${record.type}: ${record.value}${record.unit || ''} (${record.timestamp})`);
        });
    } catch (error) {
        console.error('查看健康记录失败:', error);
    } finally {
        const mongoose = require('mongoose');
        await mongoose.connection.close();
    }
}

async function viewAIReportsOnly() {
    try {
        await connectDB();
        const reports = await AIReport.find({}).populate('userId', 'username');
        console.log('🤖 AI报告数据:');
        reports.forEach(report => {
            console.log(`   ${report.userId?.username} - ${report.period}报告 (${report.generatedAt})`);
        });
    } catch (error) {
        console.error('查看AI报告失败:', error);
    } finally {
        const mongoose = require('mongoose');
        await mongoose.connection.close();
    }
}