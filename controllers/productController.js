const pool = require('../config/database');

const getAllProducts = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword, categoryId, status } = req.query;
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

    if (status) {
      whereClause += ' AND p.status = ?';
      params.push(status);
    }

    const [products] = await pool.query(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       ${whereClause} 
       ORDER BY p.created_at DESC 
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
    console.error('获取商品列表错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误，请稍后重试' 
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const [products] = await pool.query(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.id = ?`,
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '商品不存在' 
      });
    }

    res.json({
      success: true,
      data: products[0]
    });
  } catch (error) {
    console.error('获取商品详情错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误，请稍后重试' 
    });
  }
};

const createProduct = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const {
      barcode,
      name,
      categoryId,
      brand,
      unit,
      purchasePrice,
      salePrice,
      stockQuantity,
      minStock,
      maxStock,
      shelfLife,
      productionDate,
      supplier,
      description,
      imageUrl
    } = req.body;

    const [existing] = await connection.query(
      'SELECT id FROM products WHERE barcode = ?',
      [barcode]
    );

    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({ 
        success: false, 
        message: '商品条码已存在' 
      });
    }

    const [result] = await connection.query(
      `INSERT INTO products (
        barcode, name, category_id, brand, unit, purchase_price, sale_price,
        stock_quantity, min_stock, max_stock, shelf_life, production_date,
        supplier, description, image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        barcode, name, categoryId, brand, unit, purchasePrice, salePrice,
        stockQuantity, minStock, maxStock, shelfLife, productionDate,
        supplier, description, imageUrl
      ]
    );

    await connection.query(
      `INSERT INTO inventory_logs (
        product_id, change_type, quantity, before_quantity, after_quantity,
        reason, operator_id
      ) VALUES (?, 'in', ?, 0, ?, '商品入库', ?)`,
      [result.insertId, stockQuantity, stockQuantity, req.user.id]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: '商品创建成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    await connection.rollback();
    console.error('创建商品错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误，请稍后重试' 
    });
  } finally {
    connection.release();
  }
};

const updateProduct = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const {
      barcode,
      name,
      categoryId,
      brand,
      unit,
      purchasePrice,
      salePrice,
      minStock,
      maxStock,
      shelfLife,
      supplier,
      description,
      imageUrl,
      status
    } = req.body;

    const [existing] = await connection.query(
      'SELECT id, barcode FROM products WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({ 
        success: false, 
        message: '商品不存在' 
      });
    }

    if (barcode !== existing[0].barcode) {
      const [duplicate] = await connection.query(
        'SELECT id FROM products WHERE barcode = ? AND id != ?',
        [barcode, id]
      );

      if (duplicate.length > 0) {
        await connection.rollback();
        return res.status(400).json({ 
          success: false, 
          message: '商品条码已存在' 
        });
      }
    }

    await connection.query(
      `UPDATE products SET 
        barcode = ?, name = ?, category_id = ?, brand = ?, unit = ?,
        purchase_price = ?, sale_price = ?, min_stock = ?, max_stock = ?,
        shelf_life = ?, supplier = ?, description = ?, image_url = ?, status = ?
      WHERE id = ?`,
      [
        barcode, name, categoryId, brand, unit, purchasePrice, salePrice,
        minStock, maxStock, shelfLife, supplier, description, imageUrl, status, id
      ]
    );

    await connection.commit();

    res.json({
      success: true,
      message: '商品更新成功'
    });
  } catch (error) {
    await connection.rollback();
    console.error('更新商品错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误，请稍后重试' 
    });
  } finally {
    connection.release();
  }
};

const deleteProduct = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { id } = req.params;

    const [existing] = await connection.query(
      'SELECT id FROM products WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({ 
        success: false, 
        message: '商品不存在' 
      });
    }

    await connection.query('DELETE FROM products WHERE id = ?', [id]);

    await connection.commit();

    res.json({
      success: true,
      message: '商品删除成功'
    });
  } catch (error) {
    await connection.rollback();
    console.error('删除商品错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误，请稍后重试' 
    });
  } finally {
    connection.release();
  }
};

const getCategories = async (req, res) => {
  try {
    const [categories] = await pool.query(
      'SELECT * FROM categories WHERE status = ? ORDER BY sort_order, id',
      ['active']
    );

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('获取分类列表错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误，请稍后重试' 
    });
  }
};

const searchProductByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;

    const [products] = await pool.query(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.barcode = ? AND p.status = 'active'`,
      [barcode]
    );

    if (products.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '商品不存在' 
      });
    }

    res.json({
      success: true,
      data: products[0]
    });
  } catch (error) {
    console.error('搜索商品错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误，请稍后重试' 
    });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  searchProductByBarcode
};