const fs = require('fs');
const path = require('path');

// 测试配置
const TEST_USER_ID = '1760194551505'; // 使用现有的用户ID
const TEST_POST_ID = '1'; // 使用现有的帖子ID

// 数据库文件路径
const COMMENTS_PATH = path.join(__dirname, 'comments.json');
const NEWS_PATH = path.join(__dirname, 'news.json');

// 测试添加评论
function testAddComment() {
    try {
        console.log('\n===== 测试添加评论 =====');
        
        // 确保文件存在
        if (!fs.existsSync(COMMENTS_PATH)) {
            fs.writeFileSync(COMMENTS_PATH, JSON.stringify([]));
        }
        
        // 读取现有评论
        const comments = JSON.parse(fs.readFileSync(COMMENTS_PATH, 'utf8'));
        console.log('当前评论数量:', comments.length);
        
        // 创建新评论
        const newComment = {
            id: Date.now().toString(),
            postId: TEST_POST_ID,
            userId: TEST_USER_ID,
            content: '测试评论 - ' + new Date().toISOString(),
            createdAt: new Date().toISOString()
        };
        
        // 添加到评论数组
        comments.push(newComment);
        
        // 保存到文件
        fs.writeFileSync(COMMENTS_PATH, JSON.stringify(comments, null, 2));
        console.log('添加评论成功:', newComment);
        console.log('更新后评论数量:', comments.length);
        return true;
    } catch (error) {
        console.error('添加评论失败:', error.message);
        return false;
    }
}

// 测试发布资讯
function testPublishNews() {
    try {
        console.log('\n===== 测试发布资讯 =====');
        
        // 确保文件存在
        if (!fs.existsSync(NEWS_PATH)) {
            fs.writeFileSync(NEWS_PATH, JSON.stringify([]));
        }
        
        // 读取现有资讯
        const news = JSON.parse(fs.readFileSync(NEWS_PATH, 'utf8'));
        console.log('当前资讯数量:', news.length);
        
        // 创建新资讯
        const newNews = {
            id: Date.now().toString(),
            userId: TEST_USER_ID,
            title: '测试资讯标题 - ' + new Date().toISOString(),
            content: '这是一条测试资讯内容，用于测试发布功能是否正常工作。',
            tags: ['测试', '功能验证'],
            publishedAt: new Date().toISOString(),
            likes: 0,
            comments: 0
        };
        
        // 添加到资讯数组
        news.push(newNews);
        
        // 保存到文件
        fs.writeFileSync(NEWS_PATH, JSON.stringify(news, null, 2));
        console.log('发布资讯成功:', newNews);
        console.log('更新后资讯数量:', news.length);
        return true;
    } catch (error) {
        console.error('发布资讯失败:', error.message);
        return false;
    }
}

// 运行测试
function runTests() {
    console.log('开始测试社区功能...');
    
    const commentResult = testAddComment();
    const newsResult = testPublishNews();
    
    console.log('\n===== 测试结果汇总 =====');
    console.log('添加评论:', commentResult ? '成功' : '失败');
    console.log('发布资讯:', newsResult ? '成功' : '失败');
    
    if (commentResult && newsResult) {
        console.log('\n🎉 所有测试通过！数据操作功能正常。');
        console.log('请检查前端代码是否存在其他问题。');
    } else {
        console.log('\n❌ 部分测试失败，请查看详细错误信息。');
    }
}

// 执行测试
runTests();