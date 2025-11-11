const mongoose = require('mongoose');

async function testMongoDBConnection() {
    try {
        console.log('🔌 测试MongoDB连接...');
        
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tangyu_guardian';
        console.log(`📡 连接URI: ${MONGODB_URI}`);
        
        // 测试连接
        await mongoose.connect(MONGODB_URI);
        console.log('✅ MongoDB连接成功');
        
        // 检查数据库列表
        const adminDb = mongoose.connection.db.admin();
        const databases = await adminDb.listDatabases();
        console.log('\n🗄️ 数据库列表:');
        databases.databases.forEach(db => {
            console.log(`  - ${db.name} (大小: ${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
        });
        
        // 检查当前数据库的集合
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('\n📂 当前数据库的集合:');
        collections.forEach(collection => {
            console.log(`  - ${collection.name}`);
        });
        
        // 检查各集合的文档数量
        console.log('\n📊 各集合文档数量:');
        for (const collection of collections) {
            const count = await mongoose.connection.db.collection(collection.name).countDocuments();
            console.log(`  - ${collection.name}: ${count} 个文档`);
        }
        
        await mongoose.disconnect();
        console.log('\n✅ MongoDB连接测试完成');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ MongoDB连接测试失败:', error);
        process.exit(1);
    }
}

// 执行测试
testMongoDBConnection();