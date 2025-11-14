const { connectDB, User } = require('./mongodb');

async function testDatabase() {
    try {
        await connectDB();
        console.log('✅ MongoDB连接成功');
        
        // 检查testuser是否存在
        const user = await User.findOne({ username: 'testuser' });
        if (user) {
            console.log('✅ testuser用户存在');
            console.log('用户名:', user.username);
            console.log('密码:', user.password);
        } else {
            console.log('❌ testuser用户不存在');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ 数据库连接失败:', error);
        process.exit(1);
    }
}

testDatabase();