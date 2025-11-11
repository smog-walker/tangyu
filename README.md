# 糖域卫士

这是一个基于Web的糖尿病健康管理系统，提供血糖监测、生活方式干预和健康资源等功能。

## 功能特点

- 用户注册和登录系统
- 血糖、饮食、运动和用药记录
- 个性化健康分析报告
- 社区互动和经验分享
- 专业医生连接服务
- AI健康助手

## 技术栈

### 前端
- HTML5
- CSS3
- JavaScript

### 后端
- Node.js
- Express.js
- bcryptjs (密码加密)
- 文件系统存储 (简单数据存储)

## 快速开始（开发环境）

### 安装Node.js

在开始之前，您需要在您的计算机上安装Node.js。您可以从[Node.js官网](https://nodejs.org/)下载并安装最新版本。

### 安装依赖

1. 打开命令行工具（如Windows的PowerShell或cmd）
2. 导航到项目目录
   ```
   cd c:\Users\83607\Desktop\糖域卫士
   ```
3. 安装项目依赖
   ```
   npm install
   ```

### 启动开发服务器

安装依赖完成后，您可以通过以下命令启动开发服务器：

```
npm run dev
```

这将使用nodemon自动重启服务器当代码更改时，方便开发。

服务器启动后，您可以在浏览器中访问以下地址来使用系统：

```
http://localhost:3000
```

## 生产环境部署

### 系统要求
- Node.js v16.x 或更高版本
- 生产环境中建议使用PM2进行进程管理
- 可选：Nginx作为反向代理

### 部署步骤

1. **克隆项目代码**
   ```
   git clone <项目仓库地址>
   cd 糖域卫士
   ```

2. **安装依赖**
   ```
   npm install --production
   ```

3. **配置环境变量**
   创建一个`.env`文件在项目根目录，添加以下内容：
   ```
   PORT=3000
   # 可选：添加其他环境变量配置
   ```

4. **使用PM2管理进程**
   安装PM2：
   ```
   npm install pm2 -g
   ```
   使用PM2启动应用：
   ```
   pm2 start server.js --name tangyu-guardian
   ```
   设置PM2开机自启：
   ```
   pm2 startup
   pm2 save
   ```

5. **配置Nginx反向代理（可选）**
   如果您希望使用Nginx作为反向代理，可以添加以下配置：
   ```
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

6. **部署完成**
   完成上述步骤后，您的应用应该已经成功部署到生产环境。

### 注意事项

- 此项目默认使用文件系统进行数据存储，不适合大规模生产环境使用
- 对于生产环境，建议使用真正的数据库（如MongoDB、MySQL等）
- 请确保定期备份数据文件（JSON文件）
- 在生产环境中，建议添加HTTPS支持以提高安全性

## 使用说明

1. 首次访问系统时，您可以注册一个新账户或使用现有账户登录
2. 登录后，您可以访问所有功能模块
3. 未登录用户只能查看首页内容

## 项目结构

- `tangyu.html`：主HTML文件，包含所有前端界面和交互逻辑
- `server.js`：后端服务器主文件，包含API路由和服务器配置
- `database.js`：数据存储模块，处理用户数据的读写
- `apiClient.js`：前端API客户端，处理与后端的通信
- `images/`：存放项目中使用的图片资源
- `*.json`：数据文件，存储用户、健康记录、评论等数据

## API端点

系统提供了以下主要API端点：

- 用户管理：`/api/register`, `/api/login`
- 健康数据：`/api/health-data/:userId`, `/api/health-data/:userId/:type`
- AI分析报告：`/api/ai-report/:userId/:period`
- 社区互动：`/api/community-posts`, `/api/community-posts/:postId`
- 资讯管理：`/api/news`, `/api/users/:userId/news`

## 安全注意事项

1. 所有用户密码都经过bcryptjs加密存储
2. 建议在生产环境中配置HTTPS
3. 定期更新依赖包以修复安全漏洞
4. 考虑使用更安全的数据存储方案
5. 为API添加适当的身份验证和授权机制

## 常见问题

### Q: 如何修改服务器端口？
A: 可以通过修改`.env`文件中的PORT变量来更改端口号。

### Q: 数据存储在哪里？
A: 数据存储在项目根目录的各个JSON文件中。

### Q: 如何备份数据？
A: 只需复制所有JSON文件即可创建数据备份。

### Q: 系统支持多少用户？
A: 由于使用文件系统存储，系统适合小规模使用。对于大规模部署，建议迁移到数据库。