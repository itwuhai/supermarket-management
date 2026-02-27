const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const inventoryController = require('../controllers/inventoryController');
const { auth, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.get('/', auth, inventoryController.getInventory);

router.get('/logs', auth, inventoryController.getInventoryLogs);

router.get('/alerts', auth, inventoryController.getStockAlerts);

router.post('/adjust', auth, authorize('admin', 'manager'), [
  body('productId').notEmpty().withMessage('商品ID不能为空'),
  body('quantity').isInt().withMessage('数量必须是整数'),
  body('changeType').notEmpty().withMessage('变动类型不能为空')
], validate, inventoryController.adjustInventory);

router.post('/check-low-stock', auth, authorize('admin', 'manager'), inventoryController.checkLowStock);

router.put('/alerts/:id/resolve', auth, authorize('admin', 'manager'), inventoryController.resolveAlert);

module.exports = router;