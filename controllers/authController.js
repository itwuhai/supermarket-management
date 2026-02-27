const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const [users] = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: '用户名或密码错误' 
      });
    }

    const user = users[0];

    if (user.status !== 'active') {
      return res.status(403).json({ 
        success: false, 
        message: '账户已被停用，请联系管理员' 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: '用户名或密码错误' 
      });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          realName: user.real_name,
          phone: user.phone,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误，请稍后重试' 
    });
  }
};

const register = async (req, res) => {
  try {
    const { username, password, realName, phone, role } = req.body;

    const [existing] = await pool.query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existing.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: '用户名已存在' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO users (username, password, real_name, phone, role) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, realName, phone, role || 'staff']
    );

    res.status(201).json({
      success: true,
      message: '用户创建成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误，请稍后重试' 
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    const [users] = await pool.query(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '用户不存在' 
      });
    }

    const isMatch = await bcrypt.compare(oldPassword, users[0].password);

    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: '原密码错误' 
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    );

    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误，请稍后重试' 
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, username, real_name, phone, role, status, last_login, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '用户不存在' 
      });
    }

    res.json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误，请稍后重试' 
    });
  }
};

const getUsers = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, role, status } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (role) {
      whereClause += ' AND role = ?';
      params.push(role);
    }

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    // 权限控制：管理员可以查看所有用户，经理可以查看除管理员外的所有用户
    if (req.user.role === 'admin') {
      // 管理员可以查看所有用户，无需额外限制
    } else if (req.user.role === 'manager') {
      whereClause += ' AND role != ?';
      params.push('admin');
    } else if (req.user.role === 'staff') {
      return res.status(403).json({ 
        success: false, 
        message: '权限不足，无法访问用户管理功能' 
      });
    }

    const [users] = await pool.query(
      `SELECT id, username, real_name, phone, role, status, last_login, created_at 
       FROM users 
       ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), parseInt(offset)]
    );

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: {
        list: users,
        total: countResult[0].total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误，请稍后重试' 
    });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const [result] = await pool.query(
      'UPDATE users SET status = ? WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '用户不存在' 
      });
    }

    res.json({
      success: true,
      message: '用户状态更新成功'
    });
  } catch (error) {
    console.error('更新用户状态错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误，请稍后重试' 
    });
  }
};

const createUser = async (req, res) => {
  try {
    const { username, password, realName, phone, role } = req.body;

    console.log('创建用户请求:', { username, realName, phone, role, hasPassword: !!password });

    if (req.user.role === 'manager' && role === 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: '经理无法创建管理员账户' 
      });
    }

    if (role === 'admin') {
      const [existingAdmin] = await pool.query(
        'SELECT id FROM users WHERE role = ?',
        ['admin']
      );

      if (existingAdmin.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: '管理员账户已存在，系统只能有一个管理员' 
        });
      }
    }

    const [existing] = await pool.query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existing.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: '用户名已存在' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO users (username, password, real_name, phone, role) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, realName, phone || null, role || 'staff']
    );

    res.status(201).json({
      success: true,
      message: '用户创建成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('创建用户错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误，请稍后重试' 
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { realName, phone, role, status, password } = req.body;

    if (req.user.role === 'manager' && role === 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: '经理无法将用户升级为管理员' 
      });
    }

    if (role === 'admin') {
      const [existingAdmin] = await pool.query(
        'SELECT id FROM users WHERE role = ? AND id != ?',
        ['admin', id]
      );

      if (existingAdmin.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: '管理员账户已存在，系统只能有一个管理员' 
        });
      }
    }

    let updateFields = ['real_name = ?', 'phone = ?', 'role = ?', 'status = ?'];
    let updateValues = [realName, phone || null, role || 'staff', status || 'active'];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push('password = ?');
      updateValues.push(hashedPassword);
    }

    updateValues.push(id);

    const [result] = await pool.query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '用户不存在' 
      });
    }

    res.json({
      success: true,
      message: '用户更新成功'
    });
  } catch (error) {
    console.error('更新用户错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误，请稍后重试' 
    });
  }
};

const deleteUser = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { id } = req.params;

    const [existing] = await connection.query(
      'SELECT id, role FROM users WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({ 
        success: false, 
        message: '用户不存在' 
      });
    }

    if (existing[0].role === 'admin' && req.user.role !== 'admin') {
      await connection.rollback();
      return res.status(403).json({ 
        success: false, 
        message: '只有管理员才能删除管理员账户' 
      });
    }

    await connection.query('DELETE FROM users WHERE id = ?', [id]);

    await connection.commit();

    res.json({
      success: true,
      message: '用户删除成功'
    });
  } catch (error) {
    await connection.rollback();
    console.error('删除用户错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误，请稍后重试' 
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  login,
  register,
  changePassword,
  getProfile,
  getUsers,
  updateUserStatus,
  createUser,
  updateUser,
  deleteUser
};