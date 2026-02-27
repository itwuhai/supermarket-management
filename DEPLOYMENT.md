# 超市商品管理平台 - 部署指南

## 📋 目录
- [部署方案](#部署方案)
- [准备工作](#准备工作)
- [方案一：Render部署（推荐）](#方案一render部署推荐)
- [方案二：Vercel + Render](#方案二vercel--render)
- [方案三：Railway部署](#方案三railway部署)
- [常见问题](#常见问题)

---

## 🚀 部署方案

### 推荐方案：Render（免费、简单）

**优点：**
- ✅ 完全免费
- ✅ 支持全栈部署
- ✅ 内置PostgreSQL数据库
- ✅ 自动HTTPS
- ✅ 部署简单

---

## 📦 准备工作

### 1. 创建GitHub仓库

1. 访问 https://github.com/new
2. 创建新仓库，命名为`supermarket-management`
3. 选择Public或Private都可以
4. 不要初始化README
5. 点击"Create repository"

### 2. 上传代码到GitHub

在本地项目目录执行以下命令：

```bash
# 初始化Git仓库
git init

# 添加所有文件
git add .

# 提交代码
git commit -m "Initial commit: Supermarket Management Platform"

# 重命名主分支为main
git branch -M main

# 添加远程仓库（替换YOUR_USERNAME为你的GitHub用户名）
git remote add origin https://github.com/YOUR_USERNAME/supermarket-management.git

# 推送到GitHub
git push -u origin main
```

### 3. 配置环境变量

复制`.env.example`文件为`.env`：

```bash
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

**本地开发时使用：**
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=wuhai1
DB_NAME=supermarket_db
JWT_SECRET=your-secret-key-change-this-in-production
PORT=5000
NODE_ENV=development
```

**部署时需要修改为云数据库的连接信息**

---

## 方案一：Render部署（推荐）

### 步骤1：注册Render账号

1. 访问 https://dashboard.render.com
2. 点击"Sign Up"注册账号
3. 使用GitHub账号登录（推荐）

### 步骤2：创建数据库

1. 在Render控制台点击"New +"
2. 选择"PostgreSQL"
3. 数据库配置：
   - **Database Name**: `supermarket_db`
   - **User**: `supermarket_user`
   - **Region**: 选择离你最近的区域
4. 点击"Create Database"
5. 等待数据库创建完成（约2-3分钟）
6. 记录以下信息：
   - **Internal Database URL**: 用于后端连接
   - **External Database URL**: 用于外部连接（可选）

### 步骤3：部署后端

1. 在Render控制台点击"New +"
2. 选择"Web Service"
3. 连接GitHub仓库：
   - 选择`supermarket-management`仓库
   - 选择`main`分支
4. 配置服务：
   - **Name**: `supermarket-backend`
   - **Environment**: `Node`
   - **Region**: 与数据库相同区域
   - **Branch**: `main`
   - **Root Directory**: `./`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. 添加环境变量（点击"Advanced"）：
   ```env
   DB_HOST=<从Render数据库页面获取的Internal Host>
   DB_PORT=5432
   DB_USER=<从Render数据库页面获取的User>
   DB_PASSWORD=<从Render数据库页面获取的Password>
   DB_NAME=supermarket_db
   JWT_SECRET=<生成一个随机字符串，如：supermarket-secret-key-2024>
   PORT=5000
   NODE_ENV=production
   ```
6. 点击"Create Web Service"
7. 等待部署完成（约3-5分钟）
8. 记录后端URL：`https://supermarket-backend.onrender.com`

### 步骤4：初始化数据库

1. 在Render后端服务页面，点击"Shell"标签
2. 在终端中执行：
   ```bash
   node migrate.js
   ```
3. 等待数据库表创建完成
4. 默认管理员账号：
   - 用户名：`admin`
   - 密码：`admin123`

### 步骤5：部署前端

1. 在Render控制台点击"New +"
2. 选择"Static Site"
3. 连接GitHub仓库
4. 配置：
   - **Name**: `supermarket-frontend`
   - **Environment**: `Node`
   - **Branch**: `main`
   - **Root Directory**: `./client`
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
5. 添加环境变量：
   ```env
   VITE_API_URL=https://supermarket-backend.onrender.com/api
   ```
6. 点击"Create Static Site"
7. 等待部署完成（约2-3分钟）
8. 记录前端URL：`https://supermarket-frontend.onrender.com`

### 步骤6：访问应用

打开浏览器访问：`https://supermarket-frontend.onrender.com`

使用默认账号登录：
- 用户名：`admin`
- 密码：`admin123`

---

## 方案二：Vercel + Render

### 步骤1：部署后端到Render

按照方案一的步骤1-4部署后端和数据库。

### 步骤2：部署前端到Vercel

1. 访问 https://vercel.com
2. 使用GitHub账号登录
3. 点击"Add New Project"
4. 导入`supermarket-management`仓库
5. 配置项目：
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. 添加环境变量：
   - **VITE_API_URL**: `https://supermarket-backend.onrender.com/api`
7. 点击"Deploy"
8. 等待部署完成
9. Vercel会提供一个域名：`https://supermarket-management.vercel.app`

### 步骤3：配置CORS

在后端`server.js`中添加Vercel域名到CORS白名单：

```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://supermarket-frontend.onrender.com',
    'https://supermarket-management.vercel.app'
  ],
  credentials: true
}));
```

---

## 方案三：Railway部署

### 步骤1：注册Railway账号

1. 访问 https://railway.app
2. 点击"Start a New Project"
3. 使用GitHub账号登录

### 步骤2：创建项目

1. 点击"Deploy from GitHub repo"
2. 选择`supermarket-management`仓库
3. Railway会自动检测项目结构

### 步骤3：添加服务

**添加数据库：**
1. 点击"New Service"
2. 选择"MySQL"
3. Railway会自动创建MySQL数据库
4. 记录连接信息

**添加后端：**
1. 点击"New Service"
2. 选择"Repo"
3. 选择`supermarket-management`仓库
4. 配置：
   - **Root Directory**: `./`
   - **Start Command**: `node server.js`
5. 添加环境变量（从数据库服务获取连接信息）

**添加前端：**
1. 点击"New Service"
2. 选择"Static Site"
3. 选择`supermarket-management`仓库
4. 配置：
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. 添加环境变量：`VITE_API_URL`

### 步骤4：部署

1. 点击"Deploy"按钮
2. Railway会自动部署所有服务
3. 等待部署完成

---

## 🔧 配置说明

### 环境变量说明

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `DB_HOST` | 数据库主机地址 | `localhost`或云数据库地址 |
| `DB_PORT` | 数据库端口 | `3306`（MySQL）或`5432`（PostgreSQL） |
| `DB_USER` | 数据库用户名 | `root`或云数据库用户名 |
| `DB_PASSWORD` | 数据库密码 | `wuhai1`或云数据库密码 |
| `DB_NAME` | 数据库名称 | `supermarket_db` |
| `JWT_SECRET` | JWT密钥 | 随机字符串 |
| `PORT` | 后端端口 | `5000` |
| `NODE_ENV` | 运行环境 | `development`或`production` |
| `VITE_API_URL` | 前端API地址 | `https://backend.onrender.com/api` |

### CORS配置

确保后端`server.js`中正确配置CORS：

```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:5173',
    process.env.FRONTEND_URL
  ],
  credentials: true
}));
```

---

## ❓ 常见问题

### Q1: 部署后无法连接数据库

**A:** 检查以下几点：
1. 环境变量是否正确配置
2. 数据库是否在运行
3. 防火墙是否允许连接
4. 使用Render的Internal Database URL

### Q2: 前端无法访问后端API

**A:** 检查以下几点：
1. `VITE_API_URL`是否正确设置
2. 后端CORS是否允许前端域名
3. 后端是否正在运行
4. 检查浏览器控制台错误信息

### Q3: 部署失败

**A:** 常见原因：
1. `package.json`缺少`start`脚本
2. 依赖安装失败
3. 端口被占用
4. 环境变量未设置

### Q4: 如何更新部署

**A:** 
1. 修改代码后推送到GitHub
2. Render/Vercel会自动检测并重新部署
3. 或者在控制台手动触发重新部署

### Q5: 如何查看日志

**A:**
- **Render**: 在服务页面点击"Logs"标签
- **Vercel**: 在项目页面点击"Deployments"
- **Railway**: 在服务页面查看实时日志

### Q6: 免费额度限制

**A:**
- **Render免费版**：
  - 750小时/月
  - 512MB RAM
  - 数据库90天无活动会休眠

- **Vercel免费版**：
  - 无限带宽
  - 100GB构建/月
  - 无限部署

- **Railway免费版**：
  - $5/月额度
  - 512MB RAM
  - 数据库自动休眠

---

## 📞 技术支持

如果遇到问题：
1. 查看部署平台日志
2. 检查GitHub Actions构建日志
3. 查看浏览器控制台错误
4. 参考官方文档：
   - Render: https://render.com/docs
   - Vercel: https://vercel.com/docs
   - Railway: https://docs.railway.app

---

## 🎉 部署完成

恭喜！您的超市商品管理平台已成功部署。

**下一步：**
1. 访问您的应用
2. 修改默认管理员密码
3. 添加商品和用户
4. 开始使用！

**重要提示：**
- 定期备份数据库
- 监控应用性能
- 及时更新依赖
- 保持安全性
