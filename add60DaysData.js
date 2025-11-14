const mongoose = require('mongoose');
const { connectDB, User, HealthRecord, AIReport } = require('./mongodb');

// 数据库连接配置
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tangyu_guardian';

// 主函数：为指定用户添加60天数据
async function add60DaysData() {
    try {
        console.log('开始连接数据库...');
        await connectDB();
        
        // 检查用户是否存在，不存在则创建
        let user = await User.findOne({ username: '123' });
        if (!user) {
            console.log('用户不存在，创建新用户...');
            user = new User({
                username: '123',
                password: '111',
                email: 'user123@example.com',
                profile: {
                    name: '测试用户123',
                    age: 45,
                    gender: 'male',
                    diabetesType: '2型糖尿病',
                    diagnosisDate: new Date('2020-01-01')
                }
            });
            await user.save();
            console.log('用户创建成功，ID:', user._id);
        } else {
            console.log('找到现有用户，ID:', user._id);
        }
        
        // 清理该用户的所有旧记录
        console.log('清理旧记录...');
        await HealthRecord.deleteMany({ userId: user._id });
        await AIReport.deleteMany({ userId: user._id });
        console.log('旧记录清理完成');
        
        // 生成60天的健康数据
        console.log('开始生成60天健康数据...');
        const records = generate60DaysHealthData(user._id);
        
        // 批量插入健康记录
        console.log('插入健康记录到数据库...');
        await HealthRecord.insertMany(records);
        console.log(`成功插入 ${records.length} 条健康记录`);
        
        // 生成AI报告
        console.log('生成AI周报和月报...');
        await generateAIReports(user._id);
        
        console.log('数据添加完成！');
        console.log('用户信息:');
        console.log('- 用户名: 123');
        console.log('- 密码: 111');
        console.log('- 用户ID:', user._id);
        console.log('数据统计:');
        console.log('- 血糖记录: 180条 (每天3次，持续60天)');
        console.log('- 运动记录: 60条 (每天1次)');
        console.log('- 饮食记录: 180条 (每天3餐)');
        console.log('- 用药记录: 120条 (每天2次)');
        console.log('- 总计: 540条健康记录');
        
    } catch (error) {
        console.error('添加数据失败:', error);
    } finally {
        await mongoose.connection.close();
        console.log('数据库连接已关闭');
    }
}

// 生成60天的健康数据
function generate60DaysHealthData(userId) {
    const records = [];
    const today = new Date();
    
    // 生成过去60天的数据
    for (let day = 59; day >= 0; day--) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() - day);
        
        // 血糖数据 (每天3次：空腹、午餐后、晚餐后)
        const bgRecords = generateBloodGlucoseRecords(userId, currentDate);
        records.push(...bgRecords);
        
        // 运动数据 (每天1次)
        const exerciseRecord = generateExerciseRecord(userId, currentDate);
        records.push(exerciseRecord);
        
        // 饮食数据 (每天3餐)
        const dietRecords = generateDietRecords(userId, currentDate);
        records.push(...dietRecords);
        
        // 用药数据 (每天2次)
        const medicationRecords = generateMedicationRecords(userId, currentDate);
        records.push(...medicationRecords);
    }
    
    return records;
}

// 生成血糖记录
function generateBloodGlucoseRecords(userId, date) {
    const records = [];
    const times = ['空腹', '午餐后', '晚餐后'];
    const baseValues = [95, 125, 110]; // 基础血糖值
    
    times.forEach((time, index) => {
        // 添加一些随机波动，但保持数据真实性
        const randomFactor = Math.random() * 20 - 10; // -10到+10的波动
        const value = Math.max(70, Math.min(200, baseValues[index] + randomFactor));
        
        const record = new HealthRecord({
            userId: userId,
            type: 'bloodGlucose',
            value: Math.round(value),
            unit: 'mg/dL',
            notes: `${time}血糖测量`,
            timestamp: new Date(date.getTime() + index * 4 * 60 * 60 * 1000) // 间隔4小时
        });
        records.push(record);
    });
    
    return records;
}

// 生成运动记录
function generateExerciseRecord(userId, date) {
    const exerciseTypes = ['步行', '跑步', '游泳', '骑自行车', '瑜伽'];
    const type = exerciseTypes[Math.floor(Math.random() * exerciseTypes.length)];
    const duration = 30 + Math.floor(Math.random() * 30); // 30-60分钟
    
    return new HealthRecord({
        userId: userId,
        type: 'exercise',
        value: duration,
        unit: '分钟',
        notes: `${type}运动`,
        timestamp: new Date(date.getTime() + 16 * 60 * 60 * 1000) // 下午4点
    });
}

// 生成饮食记录
function generateDietRecords(userId, date) {
    const records = [];
    const meals = ['早餐', '午餐', '晚餐'];
    const baseCalories = [400, 600, 500]; // 基础热量
    const baseCarbs = [45, 65, 55]; // 基础碳水化合物
    
    meals.forEach((meal, index) => {
        const calories = baseCalories[index] + Math.floor(Math.random() * 100) - 50;
        const carbs = baseCarbs[index] + Math.floor(Math.random() * 20) - 10;
        
        const record = new HealthRecord({
            userId: userId,
            type: 'diet',
            value: calories,
            unit: '千卡',
            notes: `${meal} - 碳水化合物: ${carbs}g`,
            timestamp: new Date(date.getTime() + index * 5 * 60 * 60 * 1000), // 间隔5小时
            metadata: {
                carbohydrates: carbs,
                protein: Math.round(calories * 0.15 / 4), // 15%蛋白质
                fat: Math.round(calories * 0.25 / 9)     // 25%脂肪
            }
        });
        records.push(record);
    });
    
    return records;
}

// 生成用药记录
function generateMedicationRecords(userId, date) {
    const medications = [
        { name: '二甲双胍', dosage: '500mg' },
        { name: '格列美脲', dosage: '2mg' }
    ];
    const times = ['早餐前', '晚餐前'];
    
    return medications.flatMap(med => {
        return times.map((time, index) => {
            return new HealthRecord({
                userId: userId,
                type: 'medication',
                value: 1, // 已服用
                unit: '片',
                notes: `${med.name} ${med.dosage} - ${time}`,
                timestamp: new Date(date.getTime() + index * 10 * 60 * 60 * 1000), // 间隔10小时
                metadata: {
                    medicationName: med.name,
                    dosage: med.dosage,
                    taken: true
                }
            });
        });
    });
}

// 生成AI报告
async function generateAIReports(userId) {
    try {
        const { generateAIReport } = require('./mongodb');
        
        // 生成周报
        const weekReport = await generateAIReport(userId, 'week');
        console.log('周报生成成功');
        
        // 生成月报
        const monthReport = await generateAIReport(userId, 'month');
        console.log('月报生成成功');
        
    } catch (error) {
        console.warn('AI报告生成失败（可能数据不足）:', error.message);
    }
}

// 如果直接运行此文件，则执行主函数
if (require.main === module) {
    add60DaysData().catch(console.error);
}

module.exports = { add60DaysData };