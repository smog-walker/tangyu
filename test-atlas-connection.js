const mongoose = require('mongoose');

async function testAtlasConnection() {
    try {
        console.log('🔗 测试MongoDB Atlas连接...');
        
        // 使用您提供的连接字符串（移除过时选项）
        const atlasUri = 'mongodb+srv://vercel_app:smog123456@cluster0.ihsrdnh.mongodb.net/tangyu_guardian?retryWrites=true&w=majority';
        
        await mongoose.connect(atlasUri);
        
        console.log('✅ MongoDB Atlas连接成功！');
        
        // 检查数据库和集合
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        console.log('📊 数据库中的集合:', collections.map(c => c.name));
        
        await mongoose.connection.close();
        console.log('🎉 Atlas连接测试完成！');
        
    } catch (error) {
        console.error('❌ 连接失败:', error.message);
    }
}

testAtlasConnection();