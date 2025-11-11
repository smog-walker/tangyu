const { connectDB, User, HealthRecord } = require('./mongodb');

async function initializeDatabase() {
    try {
        console.log('正在初始化MongoDB数据库...');
        
        // 连接数据库
        await connectDB();
        
        // 检查用户是否已存在
        const existingUser = await User.findOne({ username: 'testuser' });
        
        if (existingUser) {
            console.log('✅ 测试用户已存在，用户ID:', existingUser._id);
            console.log('用户名: testuser, 密码: 123456');
            return existingUser._id.toString();
        }

        // 创建新用户
        const testUser = new User({
            username: 'testuser',
            password: '123456',
            email: 'testuser@example.com',
            phone: '13800138000'
        });

        await testUser.save();
        console.log('✅ 测试用户创建成功');
        console.log('用户ID:', testUser._id.toString());
        console.log('用户名: testuser, 密码: 123456');
        
        // 创建一些测试健康数据
        const testRecords = [
            { type: 'bloodGlucose', value: 120, unit: 'mg/dL', notes: '早餐前' },
            { type: 'bloodGlucose', value: 145, unit: 'mg/dL', notes: '午餐后' },
            { type: 'exercise', value: 30, unit: '分钟', notes: '散步' }
        ];
        
        for (const record of testRecords) {
            const healthRecord = new HealthRecord({
                userId: testUser._id,
                ...record,
                timestamp: new Date()
            });
            await healthRecord.save();
        }
        
        console.log('✅ 测试健康数据创建成功');
        console.log('🎯 数据库初始化完成！');
        
        return testUser._id.toString();
    } catch (error) {
        console.error('❌ 初始化失败:', error);
    } finally {
        // 关闭数据库连接
        const mongoose = require('mongoose');
        await mongoose.connection.close();
    }
}

initializeDatabase().then(userId => {
    if (userId) {
        console.log('\n🎯 请在前端代码中使用以下用户ID:');
        console.log('用户ID:', userId);
    }
});