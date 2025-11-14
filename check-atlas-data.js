const mongoose = require('mongoose');

async function checkAtlasData() {
    try {
        console.log('🔍 检查MongoDB Atlas数据库数据...');
        
        const atlasUri = 'mongodb+srv://vercel_app:smog123456@cluster0.ihsrdnh.mongodb.net/tangyu_guardian?retryWrites=true&w=majority';
        const conn = await mongoose.createConnection(atlasUri).asPromise();
        
        console.log('✅ Atlas数据库连接成功');
        console.log('📊 Atlas数据库数据统计:');
        
        // 获取所有集合
        const collections = await conn.db.listCollections().toArray();
        
        for (const collection of collections) {
            const count = await conn.db.collection(collection.name).countDocuments();
            console.log(`   - ${collection.name}: ${count} 条记录`);
            
            // 如果是users集合，显示用户信息
            if (collection.name === 'users') {
                const users = await conn.db.collection('users').find({}).limit(5).toArray();
                console.log('   📝 前5个用户:');
                users.forEach(user => {
                    console.log(`     👤 ${user.username} (${user._id})`);
                });
            }
            
            // 如果是healthrecords集合，显示记录类型统计
            if (collection.name === 'healthrecords') {
                const types = await conn.db.collection('healthrecords').aggregate([
                    { $group: { _id: '$type', count: { $sum: 1 } } }
                ]).toArray();
                console.log('   📈 健康记录类型统计:');
                types.forEach(type => {
                    console.log(`     📊 ${type._id}: ${type.count} 条`);
                });
            }
        }
        
        await conn.close();
        console.log('🎉 数据检查完成');
        
    } catch (error) {
        console.error('❌ 检查失败:', error.message);
    }
}

checkAtlasData();