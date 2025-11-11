const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');

// 添加测试用户
const addTestUser = () => {
    const usersFilePath = path.join(__dirname, 'users.json');
    let users = [];
    
    try {
        // 读取现有用户数据
        if (fs.existsSync(usersFilePath)) {
            const usersData = fs.readFileSync(usersFilePath, 'utf8');
            users = JSON.parse(usersData);
        }
        
        // 设置测试用户信息
        const testUser = {
            id: Date.now().toString(),
            username: '111',
            password: bcrypt.hashSync('123', 10), // 密码: 123
            createdAt: new Date().toISOString()
        };
        
        // 检查用户是否已存在
        const existingUserIndex = users.findIndex(user => user.username === testUser.username);
        
        if (existingUserIndex >= 0) {
            // 更新现有用户
            users[existingUserIndex] = testUser;
            console.log('测试用户已更新，用户名: 111, 密码: 123');
        } else {
            // 添加新用户
            users.push(testUser);
            console.log('测试用户已创建，用户名: 111, 密码: 123');
        }
        
        // 保存用户数据
        fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), 'utf8');
        console.log('用户数据已保存');
    } catch (error) {
        console.error('添加测试用户时出错:', error);
    }
};

// 执行添加测试用户
addTestUser();

// 删除这个文件，或替换为以下MongoDB版本：
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tangyu_guardian';

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function createTestUser() {
    try {
        await mongoose.connect(MONGODB_URI);
        
        const testUser = new User({
            username: 'testuser',
            password: '123456',
            email: 'testuser@example.com'
        });

        await testUser.save();
        console.log('测试用户创建成功，ID:', testUser._id);
    } catch (error) {
        console.error('创建失败:', error);
    } finally {
        await mongoose.disconnect();
    }
}

createTestUser();