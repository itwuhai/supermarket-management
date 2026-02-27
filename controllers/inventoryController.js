const pool = require('../config/database');

const getInventory = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword, categoryId, alertType } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (keyword) {
      whereClause += ' AND (p.name LIKE ? OR p.barcode LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (categoryId) {
      whereClause += ' AND p.category_id = ?';
      params.push(categoryId);
    }

    if (alertType === 'low') {
      whereClause += ' AND p.stock_quantity <= p.min_stock';
    } else if (alertType === 'high') {
      whereClause += ' AND p.stock_quantity >= p.max_stock';
    }

    const [products] = await pool.query(
      `SELECT p.*, c.name as category_name,
        CASE 
          WHEN p.stock_quantity <= p.min_stock THEN 'low'
          WHEN p.stock_quantity >= p.max_stock THEN 'high'
          ELSE 'normal'
        END as stock_status
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       ${whereClause} 
       ORDER BY p.stock_quantity ASC 
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), parseInt(offset)]
    );

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM products p ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: {
        list: products,
        total: countResult[0].total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('获取库存列表错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误，请稍后重试' 
    });
  }
};

const getInventoryLogs = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, productId, type, startDate, endDate } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (productId) {
      whereClause += ' AND il.product_id = ?';
      params.push(productId);
    }

    if (type) {
      whereClause += ' AND il.change_type = ?';
      params.push(type);
    }

    if (startDate) {
      whereClause += ' AND DATE(il.created_at) >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND DATE(il.created_at) <= ?';
      params.push(endDate);
    }

    const [logs] = await pool.query(
      `SELECT il.*, p.name as product_name, p.barcode, u.real_name as operator_name
       FROM inventory_logs il
       LEFT JOIN products p ON il.product_id = p.id
       LEFT JOIN users u ON il.operator_id = u.id
       ${whereClause}
       ORDER BY il.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), parseInt(offset)]
    );

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM inventory_logs il ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: {
        list: logs,
        total: countResult[0].total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('获取库存日志错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误，请稍后重试' 
    });
  }
};

const adjustInventory = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { productId, quantity, reason, changeType } = req.body;

    const [products] = await connection.query(
      'SELECT id, name, stock_quantity FROM products WHERE id = ?',
      [productId]
    );

    if (products.length === 0) {
      await connection.rollback();
      return res.status(404).json({ 
        success: false, 
        message: '商品不存在' 
      });
    }

    const product = products[0];
    const beforeQuantity = product.stock_quantity;
    let afterQuantity = beforeQuantity;
    let actualQuantity = quantity;

    if (changeType === 'in') {
      afterQuantity = beforeQuantity + quantity;
    } else if (changeType === 'out') {
      afterQuantity = beforeQuantity - quantity;
      actualQuantity = -quantity;
    } else {
      afterQuantity = beforeQuantity + quantity;
    }

    if (afterQuantity < 0) {
      await connection.rollback();
      return res.status(400).json({ 
        success: false, 
        message: `库存不足，当前库存：${beforeQuantity}，无法减少${changeType === 'out' ? quantity : -quantity}` 
      });
    }

    await connection.query(
      'UPDATE products SET stock_quantity = ? WHERE id = ?',
      [afterQuantity, productId]
    );

    await connection.query(
      `INSERT INTO inventory_logs (
        product_id, change_type, quantity, before_quantity, after_quantity,
        reason, operator_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [productId, changeType || 'adjust', actualQuantity, beforeQuantity, afterQuantity, reason, req.user.id]
    );

    await connection.commit();

    res.json({
      success: true,
      message: '库存调整成功',
      data: {
        beforeQuantity,
        afterQuantity
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('调整库存错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误，请稍后重试' 
    });
  } finally {
    connection.release();
  }
};

const getStockAlerts = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, alertType, isResolved } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (alertType) {
      whereClause += ' AND alert_type = ?';
      params.push(alertType);
    }

    if (isResolved !== undefined) {
      whereClause += ' AND is_resolved = ?';
      params.push(isResolved === 'true');
    }

    const [alerts] = await pool.query(
      `SELECT * FROM stock_alerts
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), parseInt(offset)]
    );

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM stock_alerts ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: {
        list: alerts,
        total: countResult[0].total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('获取库存预警错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误，请稍后重试' 
    });
  }
};

const resolveAlert = async (req, res) => {
  try {
    const { id } = req.params;

    const [alerts] = await pool.query(
      'SELECT id FROM stock_alerts WHERE id = ?',
      [id]
    );

    if (alerts.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '预警记录不存在' 
      });
    }

    await pool.query(
      'UPDATE stock_alerts SET is_resolved = ?, resolved_at = NOW() WHERE id = ?',
      [true, id]
    );

    res.json({
      success: true,
      message: '预警已标记为已解决'
    });
  } catch (error) {
    console.error('解决预警错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误，请稍后重试' 
    });
  }
};

const checkLowStock = async (req, res) => {
  try {
    const [products] = await pool.query(
      `SELECT p.id, p.name, p.barcode, p.stock_quantity, p.min_stock, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.stock_quantity <= p.min_stock
       AND p.status = 'active'
       ORDER BY p.stock_quantity ASC`
    );

    for (const product of products) {
      const [existing] = await pool.query(
        'SELECT id FROM stock_alerts WHERE product_id = ? AND alert_type = ? AND is_resolved = ?',
        [product.id, 'low', false]
      );

      if (existing.length === 0) {
        await pool.query(
          `INSERT INTO stock_alerts (
            product_id, product_name, barcode, current_stock, 
            alert_type, alert_value, message
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            product.id, product.name, product.barcode, product.stock_quantity,
            'low', product.min_stock,
            `商品 ${product.name} 库存不足，当前库存: ${product.stock_quantity}，最小库存: ${product.min_stock}`
          ]
        );
      }
    }

    res.json({
      success: true,
      message: '库存检查完成',
      data: {
        count: products.length,
        products
      }
    });
  } catch (error) {
    console.error('检查低库存错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误，请稍后重试' 
    });
  }
};

module.exports = {
  getInventory,
  getInventoryLogs,
  adjustInventory,
  getStockAlerts,
  resolveAlert,
  checkLowStock
};