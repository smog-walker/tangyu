const { connectDB, User } = require('./mongodb');

async function checkUsers() {
    try {
        console.log('🔍 正在检查数据库用户数据...');
        await connectDB();
        
        // 查看所有用户
        const users = await User.find({});
        console.log(`\n📊 数据库中总用户数: ${users.length}`);
        
        if (users.length === 0) {
            console.log('❌ 数据库中没有用户数据！');
            console.log('💡 建议：运行数据库初始化脚本创建测试用户');
            return;
        }
        
        console.log('\n👥 用户列表:');
        users.forEach((user, index) => {
            console.log(`\n${index + 1}. 用户信息:`);
            console.log(`   用户名: ${user.username}`);
            console.log(`   密码: ${user.password}`);
            console.log(`   邮箱: ${user.email || '未设置'}`);
            console.log(`   电话: ${user.phone || '未设置'}`);
            console.log(`   用户ID: ${user._id}`);
            console.log(`   创建时间: ${user.createdAt}`);
        });
        
        console.log('\n🔑 可用的登录账号:');
        users.forEach(user => {
            console.log(`   - 用户名: ${user.username}, 密码: ${user.password}`);
        });
        
    } catch (error) {
        console.error('❌ 检查用户失败:', error);
        console.log('💡 可能的原因:');
        console.log('   1. MongoDB服务未启动');
        console.log('   2. 数据库连接配置错误');
        console.log('   3. 数据库不存在');
    } finally {
        const mongoose = require('mongoose');
        await mongoose.connection.close();
    }
}

checkUsers().then(() => {
    console.log('\n✅ 用户检查完成！');
    process.exit(0);
});