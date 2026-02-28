const { Pool } = require('pg');

async function migrateDatabase() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'postgres',
  });

  try {
    console.log('开始数据库迁移...');
    console.log('连接数据库:', {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      database: process.env.DB_NAME
    });

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const schema = `
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          real_name VARCHAR(50),
          phone VARCHAR(20),
          role VARCHAR(20) DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff')),
          status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          name VARCHAR(200) NOT NULL,
          barcode VARCHAR(50) UNIQUE NOT NULL,
          category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
          price DECIMAL(10, 2) NOT NULL,
          unit VARCHAR(20),
          min_stock INTEGER DEFAULT 10,
          description TEXT,
          status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS inventory (
          id SERIAL PRIMARY KEY,
          product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          stock_quantity INTEGER NOT NULL DEFAULT 0,
          last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS sales (
          id SERIAL PRIMARY KEY,
          order_no VARCHAR(50) UNIQUE NOT NULL,
          customer_name VARCHAR(100),
          total_amount DECIMAL(10, 2) NOT NULL,
          status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
          created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS sale_items (
          id SERIAL PRIMARY KEY,
          sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
          product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
          quantity INTEGER NOT NULL,
          unit_price DECIMAL(10, 2) NOT NULL,
          total_price DECIMAL(10, 2) NOT NULL
        );

        CREATE TABLE IF NOT EXISTS inventory_logs (
          id SERIAL PRIMARY KEY,
          inventory_id INTEGER NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
          change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('in', 'out', 'adjust')),
          quantity_change INTEGER NOT NULL,
          previous_quantity INTEGER,
          new_quantity INTEGER,
          reason VARCHAR(255),
          created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS inventory_alerts (
          id SERIAL PRIMARY KEY,
          inventory_id INTEGER NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
          alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN ('low', 'high')),
          message TEXT,
          is_resolved BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;

      const statements = schema
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const statement of statements) {
        try {
          await client.query(statement);
          console.log('执行成功:', statement.substring(0, 50) + '...');
        } catch (err) {
          if (err.code !== '42P07') {
            console.log('警告:', err.message);
          }
        }
      }

      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);

      try {
        await client.query(`
          INSERT INTO users (username, password, real_name, role) 
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (username) DO NOTHING
        `, ['admin', hashedPassword, '系统管理员', 'admin']);
        console.log('默认管理员用户已插入！');
      } catch (err) {
        console.log('管理员用户已存在或插入失败:', err.message);
      }

      await client.query('COMMIT');
      console.log('数据库迁移完成！');

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('数据库迁移失败:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  migrateDatabase()
    .then(() => {
      console.log('迁移成功');
      process.exit(0);
    })
    .catch((error) => {
      console.error('迁移失败:', error);
      process.exit(1);
    });
}

module.exports = migrateDatabase;
