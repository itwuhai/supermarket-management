# 项目文件说明

## 后端文件

### 配置文件
- `server.js` - 服务器主入口文件
- `package.json` - 后端依赖配置
- `.env` - 环境变量配置（需要手动配置数据库密码等）

### 数据库
- `database/schema.sql` - 数据库表结构和初始数据

### 配置
- `config/database.js` - MySQL数据库连接配置

### 中间件
- `middleware/auth.js` - JWT认证和权限控制中间件
- `middleware/logger.js` - 操作日志记录中间件
- `middleware/validate.js` - 数据验证中间件

### 控制器
- `controllers/authController.js` - 用户认证相关逻辑
- `controllers/productController.js` - 商品管理相关逻辑
- `controllers/salesController.js` - 销售管理相关逻辑
- `controllers/inventoryController.js` - 库存管理相关逻辑

### 路由
- `routes/authRoutes.js` - 认证相关路由
- `routes/productRoutes.js` - 商品管理路由
- `routes/salesRoutes.js` - 销售管理路由
- `routes/inventoryRoutes.js` - 库存管理路由

## 前端文件

### 配置文件
- `client/package.json` - 前端依赖配置
- `client/public/index.html` - HTML入口文件

### 源代码
- `client/src/index.js` - React应用入口
- `client/src/App.js` - 主应用组件和路由配置
- `client/src/index.css` - 全局样式（大字体、高对比度）

### 组件
- `client/src/components/MainLayout.js` - 主布局组件（侧边栏、顶部导航）

### 页面
- `client/src/pages/Login.js` - 登录页面
- `client/src/pages/Dashboard.js` - 首页概览（数据统计）
- `client/src/pages/Products.js` - 商品列表页面
- `client/src/pages/ProductForm.js` - 商品添加/编辑页面
- `client/src/pages/Sales.js` - 销售订单列表页面
- `client/src/pages/SaleForm.js` - 销售订单创建页面
- `client/src/pages/Inventory.js` - 库存管理页面
- `client/src/pages/Users.js` - 用户管理页面
- `client/src/pages/Profile.js` - 个人信息页面

### 工具
- `client/src/utils/api.js` - Axios封装（请求拦截、响应拦截）

## 文档
- `README.md` - 项目说明文档（安装、使用、API文档等）

## 快速开始

### 1. 安装依赖
```bash
# 后端依赖
npm install

# 前端依赖
cd client
npm install
cd ..
```

### 2. 配置数据库
编辑 `.env` 文件，设置数据库密码：
```env
DB_PASSWORD=your_mysql_password
```

### 3. 创建数据库
```bash
mysql -u root -p
CREATE DATABASE supermarket_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;

# 导入表结构
mysql -u root -p supermarket_db < database/schema.sql
```

### 4. 启动服务
```bash
# 启动后端（终端1）
npm run dev

# 启动前端（终端2）
cd client
npm start
```

### 5. 访问系统
- 前端地址: http://localhost:3000
- 后端API: http://localhost:5000
- 默认账户: admin / admin123

## 技术特点

### 适合老人操作
- 大字体设计（16-20px）
- 大按钮（44-56px高度）
- 高对比度配色
- 清晰的功能分区
- 简洁的操作流程

### 数据安全
- bcrypt密码加密
- JWT身份验证
- 基于角色的权限控制
- 操作日志审计
- 数据验证和防注入

### 功能完整
- 商品管理（增删改查）
- 销售管理（订单、统计）
- 库存管理（查询、调整、预警）
- 用户管理（权限、状态）
- 个人信息管理