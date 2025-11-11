// create-database.js
// 这个脚本可以帮助好友初始化数据库
const { MongoClient } = require('mongodb');

async function initDatabase() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const db = client.db('tangyu_guardian');
        
        // 创建用户
        await db.command({
            createUser: 'tangyu_user',
            pwd: 'tangyu_password',
            roles: [{ role: 'readWrite', db: 'tangyu_guardian' }]
        });
        
        console.log('✅ 数据库初始化成功');
    } catch (error) {
        console.error('❌ 数据库初始化失败:', error);
    } finally {
        await client.close();
    }
}

initDatabase();
