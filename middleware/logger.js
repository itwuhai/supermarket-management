const pool = require('../config/database');

const logger = async (req, res, next) => {
  const originalSend = res.send;
  
  res.send = async function(data) {
    if (req.user && req.method !== 'GET') {
      try {
        const logData = {
          user_id: req.user.id,
          username: req.user.username,
          action: req.method + ' ' + req.path,
          module: req.path.split('/')[1] || 'system',
          description: `${req.user.real_name} 执行了 ${req.method} ${req.path}`,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('user-agent'),
          status: res.statusCode < 400 ? 'success' : 'failure'
        };

        await pool.query('INSERT INTO operation_logs SET ?', logData);
      } catch (error) {
        console.error('日志记录失败:', error);
      }
    }
    originalSend.call(this, data);
  };

  next();
};

module.exports = logger;