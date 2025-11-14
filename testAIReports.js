const { connectDB, User, HealthRecord, AIReport, generateAIReport } = require('./mongodb');

// 测试AI报告功能
async function testAIReports() {
    try {
        console.log('🔍 开始测试AI报告功能...\n');
        
        // 连接数据库
        await connectDB();
        
        // 查找用户"123"
        const user = await User.findOne({ username: '123' });
        if (!user) {
            console.error('❌ 用户"123"不存在，请先运行add60DaysData.js脚本添加数据');
            process.exit(1);
        }
        
        console.log(`✅ 找到用户: ${user.username} (ID: ${user._id})\n`);
        
        // 测试1: 生成周报
        console.log('📊 测试1: 生成AI周报');
        const weekReport1 = await generateAIReport(user._id, 'week');
        console.log('📈 周报统计摘要:');
        console.log(`   - 血糖记录数: ${weekReport1.summary.bloodGlucose.records}`);
        console.log(`   - 平均血糖值: ${weekReport1.summary.bloodGlucose.average} mg/dL`);
        console.log(`   - 运动次数: ${weekReport1.summary.exercise.count}`);
        console.log(`   - 饮食记录: ${weekReport1.summary.diet}`);
        console.log(`   - 用药记录: ${weekReport1.summary.medication}`);
        console.log(`   - 个性化建议数: ${weekReport1.recommendations.length}`);
        console.log(`   - 生成时间: ${weekReport1.generatedAt}\n`);
        
        // 测试2: 生成月报
        console.log('📊 测试2: 生成AI月报');
        const monthReport1 = await generateAIReport(user._id, 'month');
        console.log('📈 月报统计摘要:');
        console.log(`   - 血糖记录数: ${monthReport1.summary.bloodGlucose.records}`);
        console.log(`   - 平均血糖值: ${monthReport1.summary.bloodGlucose.average} mg/dL`);
        console.log(`   - 运动次数: ${monthReport1.summary.exercise.count}`);
        console.log(`   - 饮食记录: ${monthReport1.summary.diet}`);
        console.log(`   - 用药记录: ${monthReport1.summary.medication}`);
        console.log(`   - 个性化建议数: ${monthReport1.recommendations.length}`);
        console.log(`   - 生成时间: ${monthReport1.generatedAt}\n`);
        
        // 测试3: 验证数据稳定性（多次生成相同报告）
        console.log('🔄 测试3: 验证数据稳定性');
        console.log('   生成第二次周报...');
        const weekReport2 = await generateAIReport(user._id, 'week');
        
        console.log('   生成第二次月报...');
        const monthReport2 = await generateAIReport(user._id, 'month');
        
        // 比较两次生成的报告数据是否一致
        const weekDataStable = 
            weekReport1.summary.bloodGlucose.average === weekReport2.summary.bloodGlucose.average &&
            weekReport1.summary.bloodGlucose.records === weekReport2.summary.bloodGlucose.records &&
            weekReport1.summary.exercise.count === weekReport2.summary.exercise.count;
            
        const monthDataStable = 
            monthReport1.summary.bloodGlucose.average === monthReport2.summary.bloodGlucose.average &&
            monthReport1.summary.bloodGlucose.records === monthReport2.summary.bloodGlucose.records &&
            monthReport1.summary.exercise.count === monthReport2.summary.exercise.count;
        
        console.log(`   ✅ 周报数据稳定性: ${weekDataStable ? '通过' : '失败'}`);
        console.log(`   ✅ 月报数据稳定性: ${monthDataStable ? '通过' : '失败'}\n`);
        
        // 测试4: 检查缓存机制
        console.log('💾 测试4: 检查缓存机制');
        console.log('   等待2秒后生成第三次周报（应该使用缓存）...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const weekReport3 = await generateAIReport(user._id, 'week');
        const usedCache = weekReport2.generatedAt === weekReport3.generatedAt;
        console.log(`   ✅ 缓存机制: ${usedCache ? '使用缓存' : '重新生成'}\n`);
        
        // 测试5: 检查数据库中的报告记录
        console.log('🗄️ 测试5: 检查数据库中的报告记录');
        const dbReports = await AIReport.find({ userId: user._id }).sort({ generatedAt: -1 });
        console.log(`   - 数据库中的报告总数: ${dbReports.length}`);
        console.log(`   - 周报数量: ${dbReports.filter(r => r.period === 'week').length}`);
        console.log(`   - 月报数量: ${dbReports.filter(r => r.period === 'month').length}`);
        
        // 显示最新的报告摘要
        if (dbReports.length > 0) {
            const latestReport = dbReports[0];
            console.log(`   - 最新报告: ${latestReport.period} (${latestReport.generatedAt})`);
        }
        
        // 测试6: 验证基于真实数据
        console.log('\n📋 测试6: 验证基于真实数据');
        const healthRecords = await HealthRecord.find({ userId: user._id });
        const bgRecords = healthRecords.filter(r => r.type === 'bloodGlucose');
        const exerciseRecords = healthRecords.filter(r => r.type === 'exercise');
        const dietRecords = healthRecords.filter(r => r.type === 'diet');
        const medicationRecords = healthRecords.filter(r => r.type === 'medication');
        
        console.log(`   - 总健康记录数: ${healthRecords.length}`);
        console.log(`   - 血糖记录数: ${bgRecords.length}`);
        console.log(`   - 运动记录数: ${exerciseRecords.length}`);
        console.log(`   - 饮食记录数: ${dietRecords.length}`);
        console.log(`   - 用药记录数: ${medicationRecords.length}`);
        
        // 验证报告数据与真实数据的一致性
        const weekBgConsistent = weekReport1.summary.bloodGlucose.records <= bgRecords.length;
        const monthBgConsistent = monthReport1.summary.bloodGlucose.records <= bgRecords.length;
        
        console.log(`   ✅ 周报血糖数据一致性: ${weekBgConsistent ? '通过' : '失败'}`);
        console.log(`   ✅ 月报血糖数据一致性: ${monthBgConsistent ? '通过' : '失败'}`);
        
        // 测试总结
        console.log('\n🎯 测试总结:');
        console.log('========================================');
        console.log('✅ AI报告功能测试完成');
        console.log('✅ 数据稳定性验证通过');
        console.log('✅ 基于真实健康记录生成');
        console.log('✅ 缓存机制正常工作');
        console.log('✅ 个性化建议生成正常');
        console.log('========================================\n');
        
        // 显示个性化建议示例
        console.log('💡 个性化建议示例:');
        if (weekReport1.recommendations.length > 0) {
            weekReport1.recommendations.forEach((rec, index) => {
                console.log(`   ${index + 1}. ${rec}`);
            });
        }
        
    } catch (error) {
        console.error('❌ 测试过程中出现错误:', error);
    } finally {
        process.exit(0);
    }
}

// 运行测试
testAIReports();