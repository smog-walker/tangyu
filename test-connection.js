const mongoose = require('mongoose');

async function testConnection() {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tangyu_guardian';
        console.log('测试连接URI:', MONGODB_URI);
        
        await mongoose.connect(MONGODB_URI);
        console.log('✅ 连接成功');
        
        // 测试认证
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('✅ 认证成功，可访问集合:', collections.map(c => c.name));
        
        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ 连接失败:', error.message);
    }
}

testConnection();