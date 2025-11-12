// 测试AI报告初始化修复的脚本
console.log('AI报告初始化修复测试脚本已加载');

// 修复：使用全局变量避免重复声明问题
if (typeof window.initializationSteps === 'undefined') {
    window.initializationSteps = [];
}

// 等待页面加载完成
document.addEventListener('DOMContentLoaded', function() {
    window.initializationSteps.push({ time: new Date().toISOString(), event: 'DOMContentLoaded' });
    console.log('页面加载完成，检查AI报告初始化状态...');
    
    // 检查AI个性化分析区域是否存在
    const personalAnalysisSection = document.getElementById('personal-analysis');
    if (personalAnalysisSection) {
        console.log('AI个性化分析区域存在');
        
        // 检查AI个性化分析区域是否处于活动状态
        if (personalAnalysisSection.classList.contains('active')) {
            console.log('AI个性化分析区域处于活动状态');
            
            // 检查周报内容
            const weeklyReport = document.getElementById('weekly-report');
            const reportContent = weeklyReport ? weeklyReport.querySelector('.report-container') : null;
            
            if (reportContent) {
                console.log('周报容器存在');
                console.log('周报内容类型:', reportContent.innerHTML.includes('img') ? '图片' : '报告内容');
                console.log('周报内容长度:', reportContent.innerHTML.trim().length);
                window.initializationSteps.push({
                    time: new Date().toISOString(), 
                    event: 'InitialContentCheck', 
                    contentLength: reportContent.innerHTML.trim().length,
                    hasImage: reportContent.innerHTML.includes('img')
                });
                
                // 定期检查报告加载状态
                let checkCount = 0;
                const maxChecks = 5;
                const checkInterval = setInterval(() => {
                    checkCount++;
                    const currentContent = reportContent.innerHTML.trim();
                    const hasImage = currentContent.includes('img');
                    console.log(`第${checkCount}次检查报告状态: 内容长度=${currentContent.length}, 包含图片=${hasImage}`);
                    
                    window.initializationSteps.push({
                        time: new Date().toISOString(), 
                        event: 'ContentCheck', 
                        checkNumber: checkCount,
                        contentLength: currentContent.length,
                        hasImage: hasImage
                    });
                    
                    // 如果内容不为空且不包含图片，则报告已成功加载
                    if (currentContent.length > 0 && !hasImage) {
                        console.log('报告已成功加载，停止检查');
                        clearInterval(checkInterval);
                        // 显示初始化步骤摘要
                        showInitializationSummary();
                    } else if (checkCount >= maxChecks) {
                        console.log('达到最大检查次数，报告仍未正确加载，手动触发加载...');
                        clearInterval(checkInterval);
                        const currentUserId = 'current_user';
                        loadAIReport(currentUserId, 'week');
                        // 再检查一次
                        setTimeout(() => {
                            showInitializationSummary();
                        }, 1000);
                    }
                }, 500);
            } else {
                console.log('周报容器不存在');
            }
        } else {
            console.log('AI个性化分析区域不处于活动状态');
            // 如果不处于活动状态，尝试手动切换到该区域
            document.querySelector('.personal-analysis-btn')?.click();
            // 然后检查
            setTimeout(() => {
                console.log('尝试切换到AI个性化分析区域后，重新检查...');
                const weeklyReport = document.getElementById('weekly-report');
                const reportContent = weeklyReport ? weeklyReport.querySelector('.report-container') : null;
                if (reportContent) {
                    console.log('切换后周报容器存在，内容类型:', reportContent.innerHTML.includes('img') ? '图片' : '报告内容');
                }
            }, 500);
        }
    } else {
        console.log('AI个性化分析区域不存在');
    }
});

// 显示初始化摘要
function showInitializationSummary() {
    console.log('\n=== AI报告初始化摘要 ===');
    window.initializationSteps.forEach(step => {
        console.log(`[${step.time}] ${step.event}:`, step);
    });
    
    // 检查是否有成功加载的证据
    const successfulLoad = window.initializationSteps.some(step => 
        step.event === 'ContentCheck' && step.contentLength > 0 && !step.hasImage
    );
    
    console.log('\n修复效果评估:', successfulLoad ? '✓ 修复成功' : '✗ 修复未完全生效');
    if (!successfulLoad) {
        console.log('建议: 尝试手动触发报告加载，在控制台输入 window.testAIReportInit()');
    }
}

// 提供一个手动测试函数，用户可以在控制台调用
window.testAIReportInit = function() {
    console.log('手动测试AI报告初始化...');
    const currentUserId = 'current_user';
    
    // 先检查是否需要清除缓存
    if (confirm('是否清除本地缓存后重新加载？这有助于测试修复效果。')) {
        // 清除可能影响报告加载的缓存
        localStorage.clear();
        console.log('缓存已清除');
        
        // 重新加载页面
        location.reload();
    } else {
        // 直接测试报告加载
        console.log('直接测试报告加载...');
        
        // 先清除报告内容，模拟初始加载状态
        const weeklyReport = document.getElementById('weekly-report');
        const reportContent = weeklyReport ? weeklyReport.querySelector('.report-container') : null;
        if (reportContent) {
            reportContent.innerHTML = '';
            console.log('周报内容已清空，开始重新加载...');
        }
        
        // 立即加载周报
        loadAIReport(currentUserId, 'week');
        
        // 1秒后加载月报
        setTimeout(() => {
            loadAIReport(currentUserId, 'month');
        }, 1000);
        
        // 显示加载状态
        setTimeout(() => {
            showInitializationSummary();
        }, 2000);
    }
};

console.log('测试函数已注册: 请在控制台输入 window.testAIReportInit() 进行手动测试');
console.log('提示: 脚本将自动检测报告加载状态并提供修复效果评估');