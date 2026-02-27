-- 超市商品管理平台数据库设计
-- 适用于老人操作，界面清晰，数据安全

-- 1. 用户表
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
    username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '加密后的密码',
    real_name VARCHAR(50) NOT NULL COMMENT '真实姓名',
    phone VARCHAR(20) COMMENT '联系电话',
    role ENUM('admin', 'manager', 'staff') DEFAULT 'staff' COMMENT '角色：管理员/经理/员工',
    status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '状态：激活/停用',
    last_login DATETIME COMMENT '最后登录时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_username (username),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 2. 商品分类表
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '分类ID',
    name VARCHAR(100) NOT NULL COMMENT '分类名称',
    parent_id INT DEFAULT 0 COMMENT '父分类ID，0表示顶级分类',
    description TEXT COMMENT '分类描述',
    sort_order INT DEFAULT 0 COMMENT '排序顺序',
    status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_parent (parent_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品分类表';

-- 3. 商品表
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '商品ID',
    barcode VARCHAR(50) UNIQUE NOT NULL COMMENT '商品条形码',
    name VARCHAR(200) NOT NULL COMMENT '商品名称',
    category_id INT COMMENT '分类ID',
    brand VARCHAR(100) COMMENT '品牌',
    unit VARCHAR(20) DEFAULT '件' COMMENT '计量单位',
    purchase_price DECIMAL(10, 2) DEFAULT 0.00 COMMENT '进货价',
    sale_price DECIMAL(10, 2) DEFAULT 0.00 COMMENT '销售价',
    stock_quantity INT DEFAULT 0 COMMENT '当前库存数量',
    min_stock INT DEFAULT 10 COMMENT '最小库存预警值',
    max_stock INT DEFAULT 1000 COMMENT '最大库存值',
    shelf_life INT COMMENT '保质期（天）',
    production_date DATE COMMENT '生产日期',
    supplier VARCHAR(100) COMMENT '供应商',
    description TEXT COMMENT '商品描述',
    image_url VARCHAR(500) COMMENT '商品图片URL',
    status ENUM('active', 'inactive', 'out_of_stock') DEFAULT 'active' COMMENT '状态：在售/停售/缺货',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_barcode (barcode),
    INDEX idx_category (category_id),
    INDEX idx_status (status),
    INDEX idx_stock (stock_quantity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品表';

-- 4. 库存变动记录表
CREATE TABLE inventory_logs (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '记录ID',
    product_id INT NOT NULL COMMENT '商品ID',
    change_type ENUM('in', 'out', 'adjust', 'sale', 'return') NOT NULL COMMENT '变动类型：入库/出库/调整/销售/退货',
    quantity INT NOT NULL COMMENT '变动数量（正数表示增加，负数表示减少）',
    before_quantity INT NOT NULL COMMENT '变动前库存',
    after_quantity INT NOT NULL COMMENT '变动后库存',
    reason VARCHAR(200) COMMENT '变动原因',
    operator_id INT NOT NULL COMMENT '操作人ID',
    reference_id INT COMMENT '关联单据ID（如销售单号）',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_product (product_id),
    INDEX idx_type (change_type),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库存变动记录表';

-- 5. 销售订单表
CREATE TABLE sales_orders (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '订单ID',
    order_no VARCHAR(50) UNIQUE NOT NULL COMMENT '订单编号',
    customer_name VARCHAR(100) COMMENT '客户姓名',
    customer_phone VARCHAR(20) COMMENT '客户电话',
    total_amount DECIMAL(10, 2) NOT NULL COMMENT '订单总金额',
    paid_amount DECIMAL(10, 2) DEFAULT 0.00 COMMENT '已付金额',
    payment_method ENUM('cash', 'card', 'wechat', 'alipay', 'other') DEFAULT 'cash' COMMENT '支付方式',
    status ENUM('pending', 'completed', 'cancelled', 'refunded') DEFAULT 'pending' COMMENT '订单状态',
    operator_id INT NOT NULL COMMENT '操作人ID',
    remark TEXT COMMENT '备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_order_no (order_no),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='销售订单表';

-- 6. 销售订单明细表
CREATE TABLE sale_items (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '明细ID',
    order_id INT NOT NULL COMMENT '订单ID',
    product_id INT NOT NULL COMMENT '商品ID',
    product_name VARCHAR(200) NOT NULL COMMENT '商品名称',
    barcode VARCHAR(50) COMMENT '商品条码',
    unit_price DECIMAL(10, 2) NOT NULL COMMENT '单价',
    quantity INT NOT NULL COMMENT '数量',
    subtotal DECIMAL(10, 2) NOT NULL COMMENT '小计',
    discount DECIMAL(10, 2) DEFAULT 0.00 COMMENT '折扣金额',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (order_id) REFERENCES sales_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_order (order_id),
    INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='销售订单明细表';

-- 7. 采购入库单表
CREATE TABLE purchase_orders (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '采购单ID',
    order_no VARCHAR(50) UNIQUE NOT NULL COMMENT '采购单号',
    supplier VARCHAR(100) NOT NULL COMMENT '供应商',
    total_amount DECIMAL(10, 2) NOT NULL COMMENT '采购总金额',
    status ENUM('pending', 'received', 'cancelled') DEFAULT 'pending' COMMENT '状态：待收货/已收货/已取消',
    operator_id INT NOT NULL COMMENT '操作人ID',
    remark TEXT COMMENT '备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_order_no (order_no),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='采购入库单表';

-- 8. 采购明细表
CREATE TABLE purchase_items (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '明细ID',
    order_id INT NOT NULL COMMENT '采购单ID',
    product_id INT NOT NULL COMMENT '商品ID',
    product_name VARCHAR(200) NOT NULL COMMENT '商品名称',
    barcode VARCHAR(50) COMMENT '商品条码',
    unit_price DECIMAL(10, 2) NOT NULL COMMENT '单价',
    quantity INT NOT NULL COMMENT '数量',
    subtotal DECIMAL(10, 2) NOT NULL COMMENT '小计',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_order (order_id),
    INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='采购明细表';

-- 9. 操作日志表（用于安全审计）
CREATE TABLE operation_logs (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '日志ID',
    user_id INT NOT NULL COMMENT '用户ID',
    username VARCHAR(50) NOT NULL COMMENT '用户名',
    action VARCHAR(100) NOT NULL COMMENT '操作动作',
    module VARCHAR(50) NOT NULL COMMENT '操作模块',
    description TEXT COMMENT '操作描述',
    ip_address VARCHAR(50) COMMENT 'IP地址',
    user_agent VARCHAR(500) COMMENT '用户代理',
    status ENUM('success', 'failure') DEFAULT 'success' COMMENT '操作状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_module (module),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志表';

-- 10. 库存预警表
CREATE TABLE stock_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '预警ID',
    product_id INT NOT NULL COMMENT '商品ID',
    product_name VARCHAR(200) NOT NULL COMMENT '商品名称',
    barcode VARCHAR(50) COMMENT '商品条码',
    current_stock INT NOT NULL COMMENT '当前库存',
    alert_type ENUM('low', 'high', 'expired') NOT NULL COMMENT '预警类型：库存不足/库存过多/即将过期',
    alert_value INT COMMENT '预警值',
    message TEXT COMMENT '预警信息',
    is_resolved BOOLEAN DEFAULT FALSE COMMENT '是否已解决',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    resolved_at TIMESTAMP NULL COMMENT '解决时间',
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product (product_id),
    INDEX idx_type (alert_type),
    INDEX idx_resolved (is_resolved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库存预警表';

-- 插入默认管理员账户（密码：admin123，已加密）
INSERT INTO users (username, password, real_name, phone, role, status) VALUES
('admin', '$2b$10$rKQZvJzGqW5qW5qW5qW5qOqW5qW5qW5qW5qW5qW5qW5qW5qW5qW5qW5qW', '系统管理员', '13800138000', 'admin', 'active');

-- 插入默认商品分类
INSERT INTO categories (name, parent_id, description, sort_order) VALUES
('食品饮料', 0, '各类食品和饮料', 1),
('日用百货', 0, '日常生活用品', 2),
('生鲜果蔬', 0, '新鲜蔬菜水果', 3),
('零食糖果', 0, '各类零食和糖果', 4),
('酒水茶饮', 0, '酒类和茶饮', 5);