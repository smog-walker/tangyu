const fs = require('fs');
const path = require('path');

// 等待一段时间，确保服务器已经完全启动
setTimeout(() => {
    console.log('开始测试更新资讯和发表评论功能...');
    
    // 测试发表评论
    testAddComment();
    
    // 测试更新资讯
    testUpdateNews();
}, 1000);

// 测试添加评论功能
function testAddComment() {
    console.log('\n=== 测试添加评论功能 ===');
    
    try {
        const commentsFilePath = path.join(__dirname, 'comments.json');
        
        // 确保评论文件存在
        if (!fs.existsSync(commentsFilePath)) {
            fs.writeFileSync(commentsFilePath, JSON.stringify([]));
        }
        
        // 读取当前评论数
        const comments = JSON.parse(fs.readFileSync(commentsFilePath, 'utf8'));
        const initialCommentCount = comments.length;
        console.log('添加评论前的评论数量:', initialCommentCount);
        
        // 添加一条新评论
        const newComment = {
            id: Date.now().toString(),
            postId: '1', // 假设postId为1的帖子存在
            userId: '1', // 假设userId为1的用户存在
            content: '测试评论 - ' + new Date().toISOString(),
            createdAt: new Date().toISOString()
        };
        
        comments.push(newComment);
        fs.writeFileSync(commentsFilePath, JSON.stringify(comments, null, 2));
        
        // 验证评论是否添加成功
        const updatedComments = JSON.parse(fs.readFileSync(commentsFilePath, 'utf8'));
        const finalCommentCount = updatedComments.length;
        
        if (finalCommentCount === initialCommentCount + 1) {
            console.log('✓ 添加评论功能测试成功! 评论数量从', initialCommentCount, '增加到', finalCommentCount);
        } else {
            console.log('✗ 添加评论功能测试失败! 评论数量没有增加');
        }
    } catch (error) {
        console.error('✗ 添加评论功能测试失败:', error.message);
    }
}

// 测试更新资讯功能
function testUpdateNews() {
    console.log('\n=== 测试更新资讯功能 ===');
    
    try {
        const newsFilePath = path.join(__dirname, 'news.json');
        
        // 确保资讯文件存在
        if (!fs.existsSync(newsFilePath)) {
            // 如果文件不存在，创建一个示例资讯
            const sampleNews = [{
                id: '1',
                userId: '1',
                title: '测试资讯标题',
                content: '测试资讯内容',
                tags: ['测试'],
                publishedAt: new Date().toISOString(),
                likes: 0,
                comments: 0
            }];
            fs.writeFileSync(newsFilePath, JSON.stringify(sampleNews, null, 2));
            console.log('已创建示例资讯文件');
        }
        
        // 读取当前资讯
        const news = JSON.parse(fs.readFileSync(newsFilePath, 'utf8'));
        
        if (news.length === 0) {
            console.log('资讯列表为空，添加一条测试资讯');
            const newNews = {
                id: '1',
                userId: '1',
                title: '测试资讯标题',
                content: '测试资讯内容',
                tags: ['测试'],
                publishedAt: new Date().toISOString(),
                likes: 0,
                comments: 0
            };
            news.push(newNews);
            fs.writeFileSync(newsFilePath, JSON.stringify(news, null, 2));
        }
        
        // 获取第一条资讯
        const firstNews = news[0];
        console.log('更新前的资讯标题:', firstNews.title);
        
        // 更新资讯
        const updatedTitle = '已更新的测试标题 - ' + new Date().toISOString();
        const updatedContent = '已更新的测试内容';
        const updatedTags = ['更新测试', '功能测试'];
        
        firstNews.title = updatedTitle;
        firstNews.content = updatedContent;
        firstNews.tags = updatedTags;
        firstNews.updatedAt = new Date().toISOString();
        
        // 保存更新后的资讯
        fs.writeFileSync(newsFilePath, JSON.stringify(news, null, 2));
        
        // 验证资讯是否更新成功
        const updatedNews = JSON.parse(fs.readFileSync(newsFilePath, 'utf8'));
        const updatedFirstNews = updatedNews[0];
        
        if (updatedFirstNews.title === updatedTitle && 
            updatedFirstNews.content === updatedContent &&
            JSON.stringify(updatedFirstNews.tags) === JSON.stringify(updatedTags)) {
            console.log('✓ 更新资讯功能测试成功! 资讯已成功更新');
            console.log('更新后的资讯标题:', updatedFirstNews.title);
        } else {
            console.log('✗ 更新资讯功能测试失败! 资讯没有正确更新');
        }
    } catch (error) {
        console.error('✗ 更新资讯功能测试失败:', error.message);
    }
}