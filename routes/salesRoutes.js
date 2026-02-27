const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const salesController = require('../controllers/salesController');
const { auth, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.get('/', auth, salesController.getSales);

router.get('/statistics', auth, salesController.getSalesStatistics);

router.get('/:id', auth, salesController.getSaleById);

router.post('/', auth, [
  body('items').isArray({ min: 1 }).withMessage('购物车不能为空'),
  body('paymentMethod').notEmpty().withMessage('支付方式不能为空')
], validate, salesController.createSale);

router.put('/:id/cancel', auth, authorize('admin', 'manager'), salesController.cancelSale);

module.exports = router;