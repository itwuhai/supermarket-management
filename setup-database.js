const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const config = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'wuhai1',
  database: 'supermarket_db'
};

async function setupDatabase() {
  let connection;
  
  try {
    console.log('========================================');
    console.log('超市商品管理平台 - 数据库安装脚本');
    console.log('========================================\n');
    
    console.log('正在连接到MySQL服务器...');
    connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      multipleStatements: true
    });
    
    console.log('✓ 连接成功！');
    
    console.log('\n正在创建数据库...');
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log('✓ 数据库创建成功！');
    
    console.log('\n正在使用数据库...');
    await connection.query(`USE \`${config.database}\``);
    console.log('✓ 数据库选择成功！');
    
    console.log('\n正在读取SQL文件...');
    const sqlFilePath = path.join(__dirname, 'database', 'schema.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    console.log('✓ SQL文件读取成功！');
    
    console.log('\n正在执行SQL脚本...');
    
    const tables = [
      'users',
      'categories', 
      'products',
      'inventory_logs',
      'sales_orders',
      'sale_items',
      'purchase_orders',
      'purchase_items',
      'operation_logs',
      'stock_alerts'
    ];
    
    for (const table of tables) {
      try {
        await connection.query(`DROP TABLE IF EXISTS \`${table}\``);
      } catch (err) {
        console.log(`  清理表 ${table}: ${err.message}`);
      }
    }
    
    await connection.query(sqlContent);
    console.log('✓ SQL脚本执行成功！');
    
    console.log('\n正在验证数据库...');
    const [result] = await connection.query('SHOW TABLES');
    console.log(`✓ 数据库包含 ${result.length} 个表：`);
    result.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`  - ${tableName}`);
    });
    
    console.log('\n正在验证管理员账户...');
    const [users] = await connection.query('SELECT username, real_name, role FROM users WHERE username = ?', ['admin']);
    if (users.length > 0) {
      console.log('✓ 默认管理员账户已创建！');
      console.log(`  用户名: ${users[0].username}`);
      console.log(`  真实姓名: ${users[0].real_name}`);
      console.log(`  角色: ${users[0].role}`);
    }
    
    console.log('\n正在验证商品分类...');
    const [categories] = await connection.query('SELECT COUNT(*) as count FROM categories');
    console.log(`✓ 已创建 ${categories[0].count} 个商品分类`);
    
    console.log('\n========================================');
    console.log('✓ 数据库配置完成！');
    console.log('========================================');
    console.log('\n数据库信息：');
    console.log(`  主机: ${config.host}`);
    console.log(`  端口: ${config.port}`);
    console.log(`  数据库: ${config.database}`);
    console.log(`  用户: ${config.user}`);
    console.log('\n默认管理员账户：');
    console.log(`  用户名: admin`);
    console.log(`  密码: admin123`);
    console.log('\n⚠️  重要提示：首次登录后请立即修改默认密码！');
    
  } catch (error) {
    console.error('\n✗ 数据库配置失败！');
    console.error('错误信息:', error.message);
    console.error('错误代码:', error.code);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n可能的原因：');
      console.error('  1. MySQL用户名或密码错误');
      console.error('  2. MySQL服务未启动');
      console.error('  3. 用户没有足够的权限');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n可能的原因：');
      console.error('  1. MySQL服务未启动');
      console.error('  2. 端口号不正确（默认3306）');
      console.error('  3. 防火墙阻止了连接');
    } else if (error.code === 'ER_PARSE_ERROR') {
      console.error('\nSQL语法错误，请检查schema.sql文件');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n数据库连接已关闭。');
    }
  }
}

setupDatabase();