# 安装和部署指南

## 系统要求

### 软件要求
- **Node.js**: 16.x 或更高版本
- **MySQL**: 5.7 或更高版本
- **npm**: 7.x 或更高版本（或 yarn 1.22+）
- **浏览器**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### 硬件要求
- **CPU**: 双核及以上
- **内存**: 4GB 及以上
- **硬盘**: 至少 10GB 可用空间

## 安装步骤

### 第一步：安装 Node.js

1. 访问 [Node.js 官网](https://nodejs.org/)
2. 下载并安装 LTS 版本（推荐 18.x）
3. 验证安装：
```bash
node -v
npm -v
```

### 第二步：安装 MySQL

#### Windows
1. 访问 [MySQL 官网](https://dev.mysql.com/downloads/mysql/)
2. 下载 MySQL Installer
3. 运行安装程序，选择 "Developer Default"
4. 设置 root 密码（请记住这个密码）
5. 启动 MySQL 服务

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

#### macOS
```bash
brew install mysql
brew services start mysql
```

### 第三步：获取项目代码

```bash
# 如果使用 git
git clone <repository-url>
cd supermarket-management-system

# 或者直接解压项目文件
cd supermarket-management-system
```

### 第四步：安装后端依赖

```bash
npm install
```

### 第五步：安装前端依赖

```bash
cd client
npm install
cd ..
```

### 第六步：配置数据库

#### 1. 创建数据库

**Windows (命令提示符):**
```cmd
mysql -u root -p
```

**Linux/macOS:**
```bash
mysql -u root -p
```

在 MySQL 命令行中执行：
```sql
CREATE DATABASE supermarket_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

#### 2. 导入数据库结构

**Windows:**
```cmd
mysql -u root -p supermarket_db < database\schema.sql
```

**Linux/macOS:**
```bash
mysql -u root -p supermarket_db < database/schema.sql
```

### 第七步：配置环境变量

1. 复制 `.env` 文件（如果不存在则创建）
2. 编辑 `.env` 文件，修改以下配置：

```env
# 数据库配置
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=supermarket_db
DB_PORT=3306

# JWT配置
JWT_SECRET=your_secret_key_here_change_in_production
JWT_EXPIRE=7d

# 服务器配置
PORT=5000
NODE_ENV=development

# 文件上传配置
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
```

**重要提示**：
- 将 `your_mysql_password_here` 替换为你的 MySQL root 密码
- 将 `your_secret_key_here_change_in_production` 替换为一个复杂的随机字符串
- 生产环境务必修改这些默认值

### 第八步：启动后端服务

```bash
npm run dev
```

看到以下信息表示启动成功：
```
数据库连接成功
服务器运行在端口 5000
环境: development
API地址: http://localhost:5000
```

### 第九步：启动前端服务

打开新的终端窗口：

```bash
cd client
npm start
```

浏览器会自动打开 `http://localhost:3000`

## 首次登录

1. 在登录页面输入：
   - 用户名: `admin`
   - 密码: `admin123`

2. 登录成功后，建议立即修改默认密码

## 常见问题

### 问题1：数据库连接失败

**错误信息**: `数据库连接失败: Access denied for user`

**解决方案**：
1. 检查 `.env` 文件中的数据库密码是否正确
2. 确认 MySQL 服务是否正在运行
3. 检查 MySQL 用户权限

### 问题2：端口被占用

**错误信息**: `Error: listen EADDRINUSE: address already in use :::5000`

**解决方案**：
1. 修改 `.env` 文件中的 `PORT` 为其他端口（如 5001）
2. 或者停止占用该端口的程序

### 问题3：npm install 失败

**错误信息**: `npm ERR! code ECONNREFUSED`

**解决方案**：
1. 检查网络连接
2. 尝试使用淘宝镜像：
```bash
npm config set registry https://registry.npmmirror.com
```

### 问题4：前端无法访问后端API

**解决方案**：
1. 确认后端服务已启动
2. 检查 `.env` 中的端口配置
3. 查看浏览器控制台错误信息

### 问题5：登录后立即退出

**解决方案**：
1. 清除浏览器缓存和 Cookie
2. 检查 JWT_SECRET 配置
3. 确认 token 未过期

## 生产环境部署

### 使用 PM2 部署后端

1. 安装 PM2：
```bash
npm install -g pm2
```

2. 启动应用：
```bash
pm2 start server.js --name supermarket-api
```

3. 设置开机自启：
```bash
pm2 startup
pm2 save
```

4. 查看日志：
```bash
pm2 logs supermarket-api
```

### 使用 Nginx 反向代理

1. 安装 Nginx

2. 配置 Nginx（`/etc/nginx/sites-available/supermarket`）：
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 后端API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. 启用配置：
```bash
sudo ln -s /etc/nginx/sites-available/supermarket /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 构建前端生产版本

```bash
cd client
npm run build
```

构建完成后，`client/build` 目录包含生产环境文件。

### 安全建议

1. **修改默认密码**
   - 修改 admin 用户的默认密码
   - 修改 `.env` 中的 JWT_SECRET

2. **启用 HTTPS**
   - 使用 Let's Encrypt 免费证书
   - 配置 Nginx SSL

3. **数据库安全**
   - 创建专用的数据库用户
   - 限制数据库访问权限
   - 定期备份数据库

4. **防火墙配置**
   - 只开放必要的端口（80, 443）
   - 限制数据库端口访问

5. **定期更新**
   - 及时更新依赖包
   - 修复安全漏洞

## 数据备份

### 备份数据库

```bash
mysqldump -u root -p supermarket_db > backup_$(date +%Y%m%d).sql
```

### 恢复数据库

```bash
mysql -u root -p supermarket_db < backup_20240101.sql
```

### 自动备份脚本

创建 `backup.sh`：
```bash
#!/bin/bash
BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u root -pYOUR_PASSWORD supermarket_db > $BACKUP_DIR/backup_$DATE.sql

# 删除7天前的备份
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

添加到 crontab：
```bash
0 2 * * * /path/to/backup.sh
```

## 性能优化

### 数据库优化

1. 添加索引（已在 schema.sql 中配置）
2. 定期优化表：
```sql
OPTIMIZE TABLE products;
OPTIMIZE TABLE sales_orders;
```

3. 配置 MySQL 缓存

### 前端优化

1. 启用 Gzip 压缩
2. 使用 CDN 加速
3. 图片懒加载
4. 代码分割

### 后端优化

1. 使用 Redis 缓存
2. 启用连接池
3. 使用 PM2 集群模式

## 监控和日志

### 日志位置

- 后端日志：PM2 日志或控制台输出
- 前端日志：浏览器控制台
- 数据库日志：MySQL 错误日志

### 监控工具

- PM2 监控：`pm2 monit`
- 数据库监控：MySQL Workbench
- 服务器监控：htop, iostat

## 技术支持

如遇到问题，请：
1. 查看本文档的"常见问题"部分
2. 检查日志文件
3. 联系技术支持团队

## 更新日志

### v1.0.0 (2024-01-01)
- 初始版本发布
- 完成核心功能开发
- 适合老人操作的界面设计