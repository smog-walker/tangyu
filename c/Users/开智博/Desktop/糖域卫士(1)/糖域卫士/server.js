const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');

// 确保使用MongoDB模型
const { connectDB, User, HealthRecord, generateAIReport } = require('./mongodb');

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ... existing code ...