const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// 用户数据存储文件路径
const USER_DB_PATH = path.join(__dirname, 'users.json');
// 健康数据存储文件路径
const HEALTH_DATA_PATH = path.join(__dirname, 'health_data.json');
// 社区帖子存储文件路径
const COMMUNITY_POSTS_PATH = path.join(__dirname, 'community_posts.json');
// 用户评论存储文件路径
const COMMENTS_PATH = path.join(__dirname, 'comments.json');
// 用户资讯存储文件路径
const NEWS_PATH = path.join(__dirname, 'news.json');

// 确保数据库文件存在
function ensureDbExists() {
    if (!fs.existsSync(USER_DB_PATH)) {
        fs.writeFileSync(USER_DB_PATH, JSON.stringify([]));
    }
    if (!fs.existsSync(HEALTH_DATA_PATH)) {
        fs.writeFileSync(HEALTH_DATA_PATH, JSON.stringify({}));
    }
    if (!fs.existsSync(COMMUNITY_POSTS_PATH)) {
        fs.writeFileSync(COMMUNITY_POSTS_PATH, JSON.stringify([]));
    }
    if (!fs.existsSync(COMMENTS_PATH)) {
        fs.writeFileSync(COMMENTS_PATH, JSON.stringify([]));
    }
    if (!fs.existsSync(NEWS_PATH)) {
        fs.writeFileSync(NEWS_PATH, JSON.stringify([]));
    }
}

// 获取所有用户
function getAllUsers() {
    ensureDbExists();
    const data = fs.readFileSync(USER_DB_PATH, 'utf8');
    return JSON.parse(data);
}

// 保存用户数据
function saveUsers(users) {
    fs.writeFileSync(USER_DB_PATH, JSON.stringify(users, null, 2));
}

// 根据用户名查找用户
function findUserByUsername(username) {
    const users = getAllUsers();
    return users.find(user => user.username === username);
}

// 创建新用户
function createUser(username, password) {
    // 检查用户是否已存在
    const existingUser = findUserByUsername(username);
    if (existingUser) {
        return { success: false, message: '用户名已存在' };
    }

    // 密码加密
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // 创建新用户
    const newUser = {
        id: Date.now().toString(),
        username: username,
        password: hashedPassword,
        createdAt: new Date().toISOString()
    };

    // 保存到数据库
    const users = getAllUsers();
    users.push(newUser);
    saveUsers(users);

    return { success: true, user: newUser };
}

// 验证用户登录
function verifyUser(username, password) {
    const user = findUserByUsername(username);
    if (!user) {
        return { success: false, message: '用户不存在' };
    }

    // 验证密码
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
        return { success: false, message: '密码错误' };
    }

    return { success: true, user: user };
}

// 获取用户健康数据
function getUserHealthData(userId) {
    ensureDbExists();
    const data = fs.readFileSync(HEALTH_DATA_PATH, 'utf8');
    const healthData = JSON.parse(data);
    
    if (!healthData[userId]) {
        // 初始化用户健康数据
        healthData[userId] = {
            bloodGlucose: [],
            diet: [],
            exercise: [],
            medication: []
        };
    }
    
    return healthData[userId];
}

// 保存用户健康数据
function saveUserHealthData(userId, type, record) {
    ensureDbExists();
    const data = fs.readFileSync(HEALTH_DATA_PATH, 'utf8');
    const healthData = JSON.parse(data);
    
    if (!healthData[userId]) {
        healthData[userId] = {
            bloodGlucose: [],
            diet: [],
            exercise: [],
            medication: []
        };
    }
    
    // 添加记录ID和时间戳
    const newRecord = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        ...record
    };
    
    healthData[userId][type].push(newRecord);
    fs.writeFileSync(HEALTH_DATA_PATH, JSON.stringify(healthData, null, 2));
    
    return newRecord;
}

// 获取用户健康数据记录
function getUserHealthRecords(userId, type, days = 30) {
    const healthData = getUserHealthData(userId);
    const records = healthData[type] || [];
    
    // 如果指定了天数，过滤最近的数据
    if (days > 0) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        return records.filter(record => 
            new Date(record.createdAt) > cutoffDate
        );
    }
    
    return records;
}

// 生成AI分析报告（简化版，基于用户数据）
function generateAIReport(userId, period = 'week') {
    const healthData = getUserHealthData(userId);
    
    // 获取最近7天或30天的数据
    const days = period === 'week' ? 7 : 30;
    const bgRecords = getUserHealthRecords(userId, 'bloodGlucose', days);
    const dietRecords = getUserHealthRecords(userId, 'diet', days);
    const exerciseRecords = getUserHealthRecords(userId, 'exercise', days);
    const medicationRecords = getUserHealthRecords(userId, 'medication', days);
    
    // 计算血糖统计数据
    let bgStats = { average: 0, highCount: 0, lowCount: 0, normalCount: 0 };
    if (bgRecords.length > 0) {
        const total = bgRecords.reduce((sum, record) => sum + parseFloat(record.value || 0), 0);
        bgStats.average = Math.round(total / bgRecords.length);
        
        bgRecords.forEach(record => {
            const value = parseFloat(record.value || 0);
            if (value < 70) bgStats.lowCount++;
            else if (value > 180) bgStats.highCount++;
            else bgStats.normalCount++;
        });
    }
    
    // 计算运动统计数据
    let exerciseStats = { count: 0, totalMinutes: 0 };
    if (exerciseRecords.length > 0) {
        exerciseStats.count = exerciseRecords.length;
        exerciseStats.totalMinutes = exerciseRecords.reduce((sum, record) => 
            sum + parseInt(record.duration || 0), 0
        );
    }
    
    // 生成报告内容
    const report = {
        period: period,
        generatedAt: new Date().toISOString(),
        summary: {
            bloodGlucose: bgStats,
            exercise: exerciseStats,
            diet: dietRecords.length,
            medication: medicationRecords.length
        },
        recommendations: generateRecommendations(bgStats, exerciseStats, dietRecords.length)
    };
    
    return report;
}

// 生成个性化建议
function generateRecommendations(bgStats, exerciseStats, dietCount) {
    const recommendations = [];
    
    // 基于血糖数据的建议
    if (bgStats.average > 150) {
        recommendations.push('您的平均血糖值偏高，建议增加膳食纤维摄入，减少精制碳水化合物的摄入。');
    } else if (bgStats.average < 80) {
        recommendations.push('您的平均血糖值偏低，建议增加餐次或调整用药时间，避免低血糖发生。');
    } else {
        recommendations.push('您的血糖控制良好，请继续保持当前的饮食和运动习惯。');
    }
    
    if (bgStats.highCount > bgStats.normalCount) {
        recommendations.push('高血糖记录较多，建议监测餐后血糖并记录影响因素，以便调整生活方式。');
    }
    
    // 基于运动数据的建议
    if (exerciseStats.count < (exerciseStats.totalMinutes > 0 ? 3 : 5)) {
        recommendations.push('建议每周至少进行150分钟中等强度的有氧运动，如快走、游泳或骑自行车。');
    } else if (exerciseStats.totalMinutes > 300) {
        recommendations.push('您的运动量充足，请注意运动前后的血糖监测，避免运动诱发的低血糖。');
    } else {
        recommendations.push('您的运动习惯良好，请继续保持规律的运动频率和强度。');
    }
    
    // 基于饮食记录的建议
    if (dietCount < 14) {
        recommendations.push('建议增加饮食记录的频率，详细记录有助于更好地了解食物对血糖的影响。');
    } else {
        recommendations.push('您的饮食记录很规律，这有助于更好地管理血糖，建议继续保持。');
    }
    
    return recommendations;
}

// 保存用户反馈
function saveUserFeedback(userId, feedback) {
    const feedbackPath = path.join(__dirname, 'feedback.json');
    
    // 确保反馈文件存在
    if (!fs.existsSync(feedbackPath)) {
        fs.writeFileSync(feedbackPath, JSON.stringify([]));
    }
    
    const feedbacks = JSON.parse(fs.readFileSync(feedbackPath, 'utf8'));
    
    const newFeedback = {
        id: Date.now().toString(),
        userId: userId,
        type: feedback.type,
        content: feedback.content,
        createdAt: new Date().toISOString(),
        status: 'pending'
    };
    
    feedbacks.push(newFeedback);
    fs.writeFileSync(feedbackPath, JSON.stringify(feedbacks, null, 2));
    
    return newFeedback;
}

// 获取社区帖子
function getCommunityPosts(type = null, limit = 10) {
    ensureDbExists();
    const posts = JSON.parse(fs.readFileSync(COMMUNITY_POSTS_PATH, 'utf8'));
    
    // 如果指定了类型，过滤帖子
    if (type) {
        const filteredPosts = posts.filter(post => post.type === type);
        return filteredPosts.slice(-limit).reverse(); // 返回最新的帖子
    }
    
    return posts.slice(-limit).reverse(); // 返回最新的帖子
}

// 根据ID获取帖子
function getPostById(postId) {
    ensureDbExists();
    const posts = JSON.parse(fs.readFileSync(COMMUNITY_POSTS_PATH, 'utf8'));
    return posts.find(post => post.id === postId);
}

// 添加帖子评论
function addPostComment(postId, userId, content) {
    ensureDbExists();
    const comments = JSON.parse(fs.readFileSync(COMMENTS_PATH, 'utf8'));
    
    const newComment = {
        id: Date.now().toString(),
        postId: postId,
        userId: userId,
        content: content,
        createdAt: new Date().toISOString()
    };
    
    comments.push(newComment);
    fs.writeFileSync(COMMENTS_PATH, JSON.stringify(comments, null, 2));
    
    return { success: true, data: newComment };
}

// 获取帖子的评论
function getPostComments(postId) {
    ensureDbExists();
    const comments = JSON.parse(fs.readFileSync(COMMENTS_PATH, 'utf8'));
    return comments.filter(comment => comment.postId === postId);
}

// 发布资讯
function publishNews(userId, title, content, tags = []) {
    ensureDbExists();
    const news = JSON.parse(fs.readFileSync(NEWS_PATH, 'utf8'));
    
    // 处理标签：如果是字符串则分割，如果是数组则直接使用
    const processedTags = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    
    const newNews = {
        id: Date.now().toString(),
        userId: userId,
        title: title,
        content: content,
        tags: processedTags,
        publishedAt: new Date().toISOString(),
        likes: 0,
        comments: 0
    };
    
    news.push(newNews);
    fs.writeFileSync(NEWS_PATH, JSON.stringify(news, null, 2));
    
    return { success: true, data: newNews };
}

// 获取用户发布的资讯
function getUserNews(userId) {
    ensureDbExists();
    const news = JSON.parse(fs.readFileSync(NEWS_PATH, 'utf8'));
    return news.filter(n => n.userId === userId).reverse(); // 按时间倒序排列
}

// 更新资讯
function updateNews(newsId, userId, title, content, tags = []) {
    ensureDbExists();
    const news = JSON.parse(fs.readFileSync(NEWS_PATH, 'utf8'));
    const newsIndex = news.findIndex(n => n.id === newsId && n.userId === userId);
    
    if (newsIndex === -1) {
        return { success: false, message: '资讯不存在或您没有权限修改' };
    }
    
    // 处理标签：如果是字符串则分割，如果是数组则直接使用
    const processedTags = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    
    news[newsIndex] = {
        ...news[newsIndex],
        title: title,
        content: content,
        tags: processedTags,
        updatedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(NEWS_PATH, JSON.stringify(news, null, 2));
    
    return { success: true, data: news[newsIndex] };
}

// 删除资讯
function deleteNews(newsId, userId) {
    ensureDbExists();
    const news = JSON.parse(fs.readFileSync(NEWS_PATH, 'utf8'));
    const newsIndex = news.findIndex(n => n.id === newsId && n.userId === userId);
    
    if (newsIndex === -1) {
        return { success: false, message: '资讯不存在或您没有权限删除' };
    }
    
    news.splice(newsIndex, 1);
    fs.writeFileSync(NEWS_PATH, JSON.stringify(news, null, 2));
    
    return { success: true, message: '资讯删除成功' };
}

module.exports = {
    findUserByUsername,
    createUser,
    verifyUser,
    getUserHealthData,
    saveUserHealthData,
    getUserHealthRecords,
    generateAIReport,
    saveUserFeedback,
    getCommunityPosts,
    getPostById,
    addPostComment,
    getPostComments,
    publishNews,
    getUserNews,
    updateNews,
    deleteNews
};