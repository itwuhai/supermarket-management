const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const productController = require('../controllers/productController');
const { auth, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.get('/', auth, productController.getAllProducts);

router.get('/categories', auth, productController.getCategories);

router.get('/barcode/:barcode', auth, productController.searchProductByBarcode);

router.get('/:id', auth, productController.getProductById);

router.post('/', auth, authorize('admin', 'manager'), [
  body('barcode').notEmpty().withMessage('商品条码不能为空'),
  body('name').notEmpty().withMessage('商品名称不能为空'),
  body('salePrice').isFloat({ min: 0 }).withMessage('销售价必须大于等于0')
], validate, productController.createProduct);

router.put('/:id', auth, authorize('admin', 'manager'), [
  body('barcode').notEmpty().withMessage('商品条码不能为空'),
  body('name').notEmpty().withMessage('商品名称不能为空'),
  body('salePrice').isFloat({ min: 0 }).withMessage('销售价必须大于等于0')
], validate, productController.updateProduct);

router.delete('/:id', auth, authorize('admin'), productController.deleteProduct);

module.exports = router;