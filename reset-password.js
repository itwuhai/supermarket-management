const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function resetAdminPassword() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'wuhai1',
    database: 'supermarket_db'
  });

  try {
    console.log('正在重置管理员密码...');
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    console.log('新密码哈希:', hashedPassword);
    
    const [result] = await connection.query(
      'UPDATE users SET password = ? WHERE username = ?',
      [hashedPassword, 'admin']
    );
    
    if (result.affectedRows > 0) {
      console.log('✓ 管理员密码重置成功！');
      console.log('用户名: admin');
      console.log('密码: admin123');
    } else {
      console.log('✗ 未找到admin用户');
    }
    
    const [users] = await connection.query('SELECT id, username, real_name, role, status FROM users');
    console.log('\n当前用户列表:');
    console.log('ID\t用户名\t真实姓名\t角色\t状态');
    console.log('----------------------------------------');
    users.forEach(user => {
      console.log(`${user.id}\t${user.username}\t${user.real_name}\t${user.role}\t${user.status}`);
    });
    
  } catch (error) {
    console.error('重置密码失败:', error.message);
  } finally {
    await connection.end();
  }
}

resetAdminPassword();