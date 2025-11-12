const { connectDB, User, HealthRecord, AIReport } = require('./mongodb');

async function viewDatabase() {
    try {
        console.log('🔍 正在连接数据库...');
        await connectDB();
        
        console.log('\n📊 ====== 数据库概览 ======');
        
        // 查看用户数据
        console.log('\n👥 用户数据:');
        const users = await User.find({}).sort({ createdAt: -1 });
        console.log(`总用户数: ${users.length}`);
        
        users.forEach((user, index) => {
            console.log(`\n${index + 1}. 用户ID: ${user._id}`);
            console.log(`   用户名: ${user.username}`);
            console.log(`   邮箱: ${user.email || '未设置'}`);
            console.log(`   创建时间: ${user.createdAt}`);
            console.log(`   最后登录: ${user.lastLogin || '从未登录'}`);
        });
        
        // 查看健康数据统计
        console.log('\n💊 健康数据统计:');
        const healthRecords = await HealthRecord.find({}).sort({ timestamp: -1 });
        console.log(`总健康记录数: ${healthRecords.length}`);
        
        const recordsByType = {};
        healthRecords.forEach(record => {
            if (!recordsByType[record.type]) {
                recordsByType[record.type] = 0;
            }
            recordsByType[record.type]++;
        });
        
        console.log('按类型分类:');
        Object.keys(recordsByType).forEach(type => {
            console.log(`   ${type}: ${recordsByType[type]} 条记录`);
        });
        
        // 查看AI报告数据
        console.log('\n🤖 AI报告数据:');
        const aiReports = await AIReport.find({}).sort({ generatedAt: -1 });
        console.log(`总AI报告数: ${aiReports.length}`);
        
        aiReports.forEach((report, index) => {
            console.log(`\n${index + 1}. 报告ID: ${report._id}`);
            console.log(`   用户ID: ${report.userId}`);
            console.log(`   报告周期: ${report.period}`);
            console.log(`   生成时间: ${report.generatedAt}`);
            console.log(`   血糖记录数: ${report.summary?.bloodGlucose?.records || 0}`);
            console.log(`   运动记录数: ${report.summary?.exercise?.count || 0}`);
        });
        
        // 查看最近的健康数据详情
        console.log('\n📈 最近10条健康记录详情:');
        const recentRecords = await HealthRecord.find({})
            .populate('userId', 'username')
            .sort({ timestamp: -1 })
            .limit(10);
        
        recentRecords.forEach((record, index) => {
            console.log(`\n${index + 1}. 记录ID: ${record._id}`);
            console.log(`   用户: ${record.userId?.username || '未知用户'}`);
            console.log(`   类型: ${record.type}`);
            console.log(`   数值: ${record.value} ${record.unit || ''}`);
            console.log(`   备注: ${record.notes || '无'}`);
            console.log(`   时间: ${record.timestamp}`);
        });
        
        // 数据库统计摘要
        console.log('\n📋 数据库统计摘要:');
        console.log(`总用户数: ${users.length}`);
        console.log(`总健康记录数: ${healthRecords.length}`);
        console.log(`总AI报告数: ${aiReports.length}`);
        
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const recentRecordsCount = await HealthRecord.countDocuments({
            timestamp: { $gte: weekAgo }
        });
        console.log(`最近7天新增记录: ${recentRecordsCount}`);
        
    } catch (error) {
        console.error('❌ 查看数据库失败:', error);
    } finally {
        // 关闭数据库连接
        const mongoose = require('mongoose');
        await mongoose.connection.close();
        console.log('\n✅ 数据库连接已关闭');
    }
}

// 添加命令行参数支持
const args = process.argv.slice(2);
const command = args[0];

async function runCommand() {
    if (command === 'users') {
        await viewUsers();
    } else if (command === 'health') {
        await viewHealthRecords();
    } else if (command === 'reports') {
        await viewAIReports();
    } else {
        await viewDatabase();
    }
}

// 查看用户数据
async function viewUsers() {
    try {
        await connectDB();
        const users = await User.find({}).sort({ createdAt: -1 });
        
        console.log('👥 用户列表:');
        users.forEach((user, index) => {
            console.log(`\n${index + 1}. ${user.username}`);
            console.log(`   ID: ${user._id}`);
            console.log(`   邮箱: ${user.email || '未设置'}`);
            console.log(`   创建时间: ${user.createdAt}`);
            console.log(`   最后登录: ${user.lastLogin || '从未登录'}`);
        });
    } catch (error) {
        console.error('查看用户失败:', error);
    } finally {
        const mongoose = require('mongoose');
        await mongoose.connection.close();
    }
}

// 查看健康记录
async function viewHealthRecords() {
    try {
        await connectDB();
        const records = await HealthRecord.find({})
            .populate('userId', 'username')
            .sort({ timestamp: -1 })
            .limit(20);
        
        console.log('💊 健康记录列表:');
        records.forEach((record, index) => {
            console.log(`\n${index + 1}. ${record.userId?.username || '未知用户'} - ${record.type}`);
            console.log(`   数值: ${record.value} ${record.unit || ''}`);
            console.log(`   备注: ${record.notes || '无'}`);
            console.log(`   时间: ${record.timestamp}`);
            console.log(`   记录ID: ${record._id}`);
        });
    } catch (error) {
        console.error('查看健康记录失败:', error);
    } finally {
        const mongoose = require('mongoose');
        await mongoose.connection.close();
    }
}

// 查看AI报告
async function viewAIReports() {
    try {
        await connectDB();
        const reports = await AIReport.find({})
            .populate('userId', 'username')
            .sort({ generatedAt: -1 });
        
        console.log('🤖 AI报告列表:');
        reports.forEach((report, index) => {
            console.log(`\n${index + 1}. ${report.userId?.username || '未知用户'} - ${report.period}报告`);
            console.log(`   生成时间: ${report.generatedAt}`);
            console.log(`   血糖记录数: ${report.summary?.bloodGlucose?.records || 0}`);
            console.log(`   运动记录数: ${report.summary?.exercise?.count || 0}`);
            console.log(`   建议数量: ${report.recommendations?.length || 0}`);
            console.log(`   报告ID: ${report._id}`);
        });
    } catch (error) {
        console.error('查看AI报告失败:', error);
    } finally {
        const mongoose = require('mongoose');
        await mongoose.connection.close();
    }
}

// 运行主函数
runCommand().then(() => {
    console.log('\n🎯 数据库查看完成！');
    process.exit(0);
}).catch(error => {
    console.error('执行失败:', error);
    process.exit(1);
});