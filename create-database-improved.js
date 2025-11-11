// create-database-improved.js
// 改进版数据库初始化脚本，能够处理用户已存在的情况
const { MongoClient } = require('mongodb');

async function initDatabase() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const db = client.db('tangyu_guardian');
        
        console.log('🔍 检查数据库用户状态...');
        
        try {
            // 尝试创建用户
            await db.command({
                createUser: 'tangyu_user',
                pwd: 'tangyu_password',
                roles: [{ role: 'readWrite', db: 'tangyu_guardian' }]
            });
            console.log('✅ 数据库用户创建成功');
        } catch (error) {
            if (error.code === 51003 || error.message.includes('already exists')) {
                console.log('ℹ️  数据库用户已存在，跳过创建');
            } else {
                throw error; // 重新抛出其他错误
            }
        }
        
        console.log('✅ 数据库初始化完成');
        console.log('💡 现在可以启动服务器: npm run dev');
        
    } catch (error) {
        console.error('❌ 数据库初始化失败:', error.message);
    } finally {
        await client.close();
    }
}

initDatabase();

