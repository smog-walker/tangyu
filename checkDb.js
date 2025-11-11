const fs = require('fs');
const path = require('path');

// 读取database.js文件的前10行
const filePath = path.join(__dirname, 'database.js');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log('database.js前10行内容:');
for (let i = 0; i < Math.min(10, lines.length); i++) {
    console.log(`第${i+1}行:`, JSON.stringify(lines[i]));
}

// 检查是否有BOM字符
if (content.charCodeAt(0) === 0xFEFF) {
    console.log('检测到BOM字符');
}