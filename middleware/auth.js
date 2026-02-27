const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ success: false, message: '未提供认证令牌' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const [users] = await pool.query(
      'SELECT id, username, real_name, role, status FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: '用户不存在' });
    }

    if (users[0].status !== 'active') {
      return res.status(403).json({ success: false, message: '账户已被停用' });
    }

    req.user = users[0];
    next();
  } catch (error) {
    console.error('认证错误:', error);
    res.status(401).json({ success: false, message: '认证失败' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: '权限不足，需要以下角色之一: ' + roles.join(', ') 
      });
    }
    next();
  };
};

module.exports = { auth, authorize };