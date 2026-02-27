const pool = require('../config/database');
const moment = require('moment');

const createSale = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { customerName, customerPhone, items, paymentMethod, remark } = req.body;

    if (!items || items.length === 0) {
      await connection.rollback();
      return res.status(400).json({ 
        success: false, 
        message: '购物车为空' 
      });
    }

    let totalAmount = 0;

    for (const item of items) {
      const [products] = await connection.query(
        'SELECT id, name, barcode, sale_price, stock_quantity, status FROM products WHERE id = ?',
        [item.productId]
      );

      if (products.length === 0) {
        await connection.rollback();
        return res.status(404).json({ 
          success: false, 
          message: `商品ID ${item.productId} 不存在` 
        });
      }

      const product = products[0];

      if (product.status !== 'active') {
        await connection.rollback();
        return res.status(400).json({ 
          success: false, 
          message: `商品 ${product.name} 已下架` 
        });
      }

      if (product.stock_quantity < item.quantity) {
        await connection.rollback();
        return res.status(400).json({ 
          success: false, 
          message: `商品 ${product.name} 库存不足，当前库存: ${product.stock_quantity}` 
        });
      }

      item.productName = product.name;
      item.barcode = product.barcode;
      item.unitPrice = product.sale_price;
      item.subtotal = product.sale_price * item.quantity;
      totalAmount += item.subtotal;
    }

    const orderNo = 'SO' + moment().format('YYYYMMDDHHmmss') + Math.floor(Math.random() * 1000);

    const [orderResult] = await connection.query(
      `INSERT INTO sales_orders (
        order_no, customer_name, customer_phone, total_amount, 
        payment_method, status, operator_id, remark
      ) VALUES (?, ?, ?, ?, ?, 'completed', ?, ?)`,
      [orderNo, customerName, customerPhone, totalAmount, paymentMethod, req.user.id, remark]
    );

    for (const item of items) {
      await connection.query(
        `INSERT INTO sale_items (
          order_id, product_id, product_name, barcode, unit_price, 
          quantity, subtotal, discount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderResult.insertId, item.productId, item.productName, item.barcode,
          item.unitPrice, item.quantity, item.subtotal, item.discount || 0
        ]
      );

      const [productInfo] = await connection.query(
        'SELECT stock_quantity FROM products WHERE id = ?',
        [item.productId]
      );

      const beforeQuantity = productInfo[0].stock_quantity;
      const afterQuantity = beforeQuantity - item.quantity;

      await connection.query(
        'UPDATE products SET stock_quantity = ? WHERE id = ?',
        [afterQuantity, item.productId]
      );

      await connection.query(
        `INSERT INTO inventory_logs (
          product_id, change_type, quantity, before_quantity, after_quantity,
          reason, operator_id, reference_id
        ) VALUES (?, 'sale', ?, ?, ?, '销售', ?, ?)`,
        [item.productId, -item.quantity, beforeQuantity, afterQuantity, req.user.id, orderResult.insertId]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: '销售成功',
      data: {
        orderId: orderResult.insertId,
        orderNo,
        totalAmount
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('创建销售订单错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误，请稍后重试' 
    });
  } finally {
    connection.release();
  }
};

const getSales = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, startDate, endDate, status } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (startDate) {
      whereClause += ' AND DATE(so.created_at) >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND DATE(so.created_at) <= ?';
      params.push(endDate);
    }

    if (status) {
      whereClause += ' AND so.status = ?';
      params.push(status);
    }

    const [sales] = await pool.query(
      `SELECT so.*, u.real_name as operator_name 
       FROM sales_orders so 
       LEFT JOIN users u ON so.operator_id = u.id 
       ${whereClause} 
       ORDER BY so.created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), parseInt(offset)]
    );

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM sales_orders so ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: {
        list: sales,
        total: countResult[0].total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('获取销售列表错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误，请稍后重试' 
    });
  }
};

const getSaleById = async (req, res) => {
  try {
    const { id } = req.params;

    const [orders] = await pool.query(
      `SELECT so.*, u.real_name as operator_name 
       FROM sales_orders so 
       LEFT JOIN users u ON so.operator_id = u.id 
       WHERE so.id = ?`,
      [id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '订单不存在' 
      });
    }

    const [items] = await pool.query(
      'SELECT * FROM sale_items WHERE order_id = ?',
      [id]
    );

    res.json({
      success: true,
      data: {
        order: orders[0],
        items
      }
    });
  } catch (error) {
    console.error('获取订单详情错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误，请稍后重试' 
    });
  }
};

const cancelSale = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { id } = req.params;

    const [orders] = await connection.query(
      'SELECT * FROM sales_orders WHERE id = ?',
      [id]
    );

    if (orders.length === 0) {
      await connection.rollback();
      return res.status(404).json({ 
        success: false, 
        message: '订单不存在' 
      });
    }

    if (orders[0].status === 'cancelled') {
      await connection.rollback();
      return res.status(400).json({ 
        success: false, 
        message: '订单已取消' 
      });
    }

    const [items] = await connection.query(
      'SELECT * FROM sale_items WHERE order_id = ?',
      [id]
    );

    for (const item of items) {
      const [productInfo] = await connection.query(
        'SELECT stock_quantity FROM products WHERE id = ?',
        [item.product_id]
      );

      if (productInfo.length === 0) {
        continue;
      }

      const beforeQuantity = productInfo[0].stock_quantity;
      const afterQuantity = beforeQuantity + item.quantity;

      await connection.query(
        'UPDATE products SET stock_quantity = ? WHERE id = ?',
        [afterQuantity, item.product_id]
      );

      await connection.query(
        `INSERT INTO inventory_logs (
          product_id, change_type, quantity, before_quantity, after_quantity,
          reason, operator_id, reference_id
        ) VALUES (?, 'return', ?, ?, ?, '取消订单', ?, ?)`,
        [item.product_id, item.quantity, beforeQuantity, afterQuantity, req.user.id, id]
      );
    }

    await connection.query(
      'UPDATE sales_orders SET status = ? WHERE id = ?',
      ['cancelled', id]
    );

    await connection.commit();

    res.json({
      success: true,
      message: '订单取消成功'
    });
  } catch (error) {
    await connection.rollback();
    console.error('取消订单错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误，请稍后重试' 
    });
  } finally {
    connection.release();
  }
};

const getSalesStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = 'WHERE status = \'completed\'';
    const params = [];

    if (startDate && endDate) {
      dateFilter = 'WHERE DATE(created_at) BETWEEN ? AND ? AND status = \'completed\'';
      params.push(startDate, endDate);
    } else if (startDate) {
      dateFilter = 'WHERE DATE(created_at) >= ? AND status = \'completed\'';
      params.push(startDate);
    } else if (endDate) {
      dateFilter = 'WHERE DATE(created_at) <= ? AND status = \'completed\'';
      params.push(endDate);
    }

    const [totalSales] = await pool.query(
      `SELECT 
        COUNT(*) as order_count,
        SUM(total_amount) as total_amount,
        AVG(total_amount) as avg_amount
       FROM sales_orders
       ${dateFilter}`,
      params
    );

    const [topProducts] = await pool.query(
      `SELECT 
        product_id,
        product_name,
        SUM(quantity) as total_quantity,
        SUM(subtotal) as total_sales
       FROM sale_items
       WHERE order_id IN (
         SELECT id FROM sales_orders ${dateFilter}
       )
       GROUP BY product_id, product_name
       ORDER BY total_sales DESC
       LIMIT 10`,
      params
    );

    const [dailySales] = await pool.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as order_count,
        SUM(total_amount) as total_amount
       FROM sales_orders
       ${dateFilter}
       GROUP BY DATE(created_at)
       ORDER BY date DESC
       LIMIT 30`,
      params
    );

    res.json({
      success: true,
      data: {
        summary: totalSales[0],
        topProducts,
        dailySales
      }
    });
  } catch (error) {
    console.error('获取销售统计错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误，请稍后重试' 
    });
  }
};

module.exports = {
  createSale,
  getSales,
  getSaleById,
  cancelSale,
  getSalesStatistics
};