const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { auth, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.post('/login', [
  body('username').notEmpty().withMessage('用户名不能为空'),
  body('password').notEmpty().withMessage('密码不能为空')
], validate, authController.login);

router.post('/register', [
  body('username').notEmpty().withMessage('用户名不能为空'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6位'),
  body('realName').notEmpty().withMessage('真实姓名不能为空')
], validate, authController.register);

router.post('/change-password', auth, [
  body('oldPassword').notEmpty().withMessage('原密码不能为空'),
  body('newPassword').isLength({ min: 6 }).withMessage('新密码至少6位')
], validate, authController.changePassword);

router.get('/profile', auth, authController.getProfile);

router.get('/users', auth, authorize('admin', 'manager'), authController.getUsers);

router.post('/users', auth, authorize('admin', 'manager'), [
  body('username').notEmpty().withMessage('用户名不能为空'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6位'),
  body('realName').notEmpty().withMessage('真实姓名不能为空')
], validate, authController.createUser);

router.put('/users/:id', auth, authorize('admin', 'manager'), [
  body('realName').notEmpty().withMessage('真实姓名不能为空')
], validate, authController.updateUser);

router.put('/users/:id/status', auth, authorize('admin', 'manager'), authController.updateUserStatus);

router.delete('/users/:id', auth, authorize('admin', 'manager'), authController.deleteUser);

module.exports = router;