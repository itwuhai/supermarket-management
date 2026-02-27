import React, { useEffect, useState } from 'react';
import { Table, Button, Input, Space, Tag, Card, Select, Modal, InputNumber, message, Popconfirm, Alert } from 'antd';
import { SearchOutlined, PlusOutlined, HistoryOutlined, WarningOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import api from '../utils/api';

const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

const Inventory = () => {
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [filters, setFilters] = useState({ keyword: '', categoryId: '', alertType: '' });
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [logsModalVisible, setLogsModalVisible] = useState(false);
  const [alertsModalVisible, setAlertsModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustForm, setAdjustForm] = useState({ quantity: 0, reason: '', changeType: 'adjust' });
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
    fetchInventory();
    fetchAlerts();
  }, [pagination.current, pagination.pageSize, filters]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await api.get('/inventory', {
        params: {
          page: pagination.current,
          pageSize: pagination.pageSize,
          keyword: filters.keyword,
          alertType: filters.alertType
        }
      });

      if (response.success) {
        setInventory(response.data.list);
        setPagination(prev => ({ ...prev, total: response.data.total }));
      }
    } catch (error) {
      console.error('获取库存列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await api.get('/inventory/alerts', {
        params: { isResolved: 'false', pageSize: 100 }
      });

      if (response.success) {
        setAlerts(response.data.list);
      }
    } catch (error) {
      console.error('获取库存预警失败:', error);
    }
  };

  const fetchLogs = async (productId) => {
    try {
      const response = await api.get('/inventory/logs', {
        params: { productId, pageSize: 50 }
      });

      if (response.success) {
        setLogs(response.data.list);
      }
    } catch (error) {
      console.error('获取库存日志失败:', error);
    }
  };

  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, keyword: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleAlertTypeChange = (value) => {
    setFilters(prev => ({ ...prev, alertType: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleAdjust = (record) => {
    setSelectedProduct(record);
    setAdjustForm({ quantity: 0, reason: '', changeType: 'adjust' });
    setAdjustModalVisible(true);
  };

  const handleViewLogs = (record) => {
    setSelectedProduct(record);
    fetchLogs(record.id);
    setLogsModalVisible(true);
  };

  const handleViewAlerts = () => {
    setAlertsModalVisible(true);
  };

  const confirmAdjust = async () => {
    try {
      const response = await api.post('/inventory/adjust', {
        productId: selectedProduct.id,
        quantity: adjustForm.quantity,
        reason: adjustForm.reason,
        changeType: adjustForm.changeType
      });

      if (response.success) {
        message.success('库存调整成功');
        setAdjustModalVisible(false);
        fetchInventory();
      }
    } catch (error) {
      console.error('调整库存失败:', error);
    }
  };

  const handleCheckLowStock = async () => {
    try {
      const response = await api.post('/inventory/check-low-stock');
      if (response.success) {
        message.success(`检查完成，发现 ${response.data.count} 个低库存商品`);
        fetchAlerts();
        fetchInventory();
      }
    } catch (error) {
      console.error('检查低库存失败:', error);
    }
  };

  const handleDelete = async (record) => {
    try {
      const response = await api.delete(`/products/${record.id}`);
      if (response.success) {
        message.success('删除成功');
        fetchInventory();
        fetchAlerts();
      }
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  const columns = [
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      fixed: 'left',
    },
    {
      title: '条码',
      dataIndex: 'barcode',
      key: 'barcode',
      width: 140,
    },
    {
      title: '分类',
      dataIndex: 'category_name',
      key: 'category_name',
      width: 120,
      render: (text) => text || '-',
    },
    {
      title: '当前库存',
      dataIndex: 'stock_quantity',
      key: 'stock_quantity',
      width: 120,
      render: (quantity, record) => {
        const isLow = quantity <= record.min_stock;
        const isHigh = quantity >= record.max_stock;
        let color = '#52c41a';
        if (isLow) color = '#ff4d4f';
        else if (isHigh) color = '#faad14';
        return <span style={{ color, fontWeight: 'bold', fontSize: '18px' }}>{quantity}</span>;
      },
    },
    {
      title: '最小库存',
      dataIndex: 'min_stock',
      key: 'min_stock',
      width: 100,
    },
    {
      title: '最大库存',
      dataIndex: 'max_stock',
      key: 'max_stock',
      width: 100,
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'stock_status',
      key: 'stock_status',
      width: 100,
      render: (status) => {
        const statusMap = {
          low: { text: '库存不足', color: 'red' },
          high: { text: '库存过多', color: 'orange' },
          normal: { text: '正常', color: 'green' },
        };
        const { text, color } = statusMap[status] || { text: status, color: 'default' };
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="large"
            onClick={() => handleAdjust(record)}
          >
            调整
          </Button>
          <Button
            icon={<HistoryOutlined />}
            size="large"
            onClick={() => handleViewLogs(record)}
          >
            日志
          </Button>
          <Popconfirm
            title="确定要删除这个商品吗？"
            description="删除后无法恢复，请谨慎操作"
            onConfirm={() => handleDelete(record)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              size="large"
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const logColumns = [
    {
      title: '变动类型',
      dataIndex: 'change_type',
      key: 'change_type',
      width: 100,
      render: (type) => {
        const typeMap = {
          in: { text: '入库', color: 'green' },
          out: { text: '出库', color: 'red' },
          adjust: { text: '调整', color: 'blue' },
          sale: { text: '销售', color: 'orange' },
          return: { text: '退货', color: 'purple' },
        };
        const { text, color } = typeMap[type] || { text: type, color: 'default' };
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '变动数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      render: (quantity) => (
        <span style={{ color: quantity > 0 ? '#52c41a' : '#ff4d4f', fontWeight: 'bold' }}>
          {quantity > 0 ? '+' : ''}{quantity}
        </span>
      ),
    },
    {
      title: '变动前',
      dataIndex: 'before_quantity',
      key: 'before_quantity',
      width: 100,
    },
    {
      title: '变动后',
      dataIndex: 'after_quantity',
      key: 'after_quantity',
      width: 100,
    },
    {
      title: '原因',
      dataIndex: 'reason',
      key: 'reason',
      width: 150,
      ellipsis: true,
    },
    {
      title: '操作人',
      dataIndex: 'operator_name',
      key: 'operator_name',
      width: 100,
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date) => new Date(date).toLocaleString('zh-CN'),
    },
  ];

  const alertColumns = [
    {
      title: '商品名称',
      dataIndex: 'product_name',
      key: 'product_name',
      width: 200,
    },
    {
      title: '条码',
      dataIndex: 'barcode',
      key: 'barcode',
      width: 140,
    },
    {
      title: '当前库存',
      dataIndex: 'current_stock',
      key: 'current_stock',
      width: 100,
      render: (stock) => <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>{stock}</span>,
    },
    {
      title: '预警类型',
      dataIndex: 'alert_type',
      key: 'alert_type',
      width: 100,
      render: (type) => {
        const typeMap = {
          low: { text: '库存不足', color: 'red' },
          high: { text: '库存过多', color: 'orange' },
          expired: { text: '即将过期', color: 'purple' },
        };
        const { text, color } = typeMap[type] || { text: type, color: 'default' };
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '预警信息',
      dataIndex: 'message',
      key: 'message',
      width: 300,
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date) => new Date(date).toLocaleString('zh-CN'),
    },
  ];

  return (
    <Card 
      style={{ 
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
      bodyStyle={{ padding: '24px' }}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.95)', 
          padding: '20px', 
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
        }}>
          <Space size="middle" wrap>
            <Search
              placeholder="搜索商品名称或条码几个字"
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              style={{ width: 350 }}
              onSearch={handleSearch}
            />
            <Select
              placeholder="预警类型"
              allowClear
              size="large"
              style={{ width: 150 }}
              onChange={handleAlertTypeChange}
              value={filters.alertType || undefined}
            >
              <Option value="low">库存不足</Option>
              <Option value="high">库存过多</Option>
            </Select>
            <Button
              type="primary"
              icon={<WarningOutlined />}
              size="large"
              style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '6px'
              }}
              onClick={handleViewAlerts}
            >
              查看预警 ({alerts.length})
            </Button>
            <Button
              icon={<PlusOutlined />}
              size="large"
              style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '6px'
              }}
              onClick={handleCheckLowStock}
            >
              检查低库存
            </Button>
          </Space>
        </div>

        <div style={{ 
          background: 'rgba(255, 255, 255, 0.95)', 
          padding: '20px', 
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
        }}>
          <Table
            columns={columns}
            dataSource={inventory}
            rowKey="id"
            loading={loading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
              pageSizeOptions: ['10', '20', '50', '100'],
              onChange: (page, pageSize) => {
                setPagination(prev => ({ ...prev, current: page, pageSize }));
              },
            }}
            scroll={{ x: 1400 }}
            size="middle"
            style={{ borderRadius: '6px' }}
          />
        </div>
      </Space>

      <Modal
        title="调整库存"
        open={adjustModalVisible}
        onOk={confirmAdjust}
        onCancel={() => setAdjustModalVisible(false)}
        okText="确认调整"
        cancelText="取消"
        width={600}
      >
        {selectedProduct && (
          <div>
            {currentUser && (
              <Alert
                message={
                  <div>
                    <UserOutlined /> 操作人：<strong>{currentUser.realName || currentUser.username}</strong>
                    <br />
                    角色：<strong>{currentUser.role === 'admin' ? '管理员' : currentUser.role === 'manager' ? '经理' : '员工'}</strong>
                  </div>
                }
                type="info"
                style={{ marginBottom: '16px' }}
              />
            )}
            <p style={{ fontSize: '18px', marginBottom: '16px' }}>
              <strong>商品：</strong>{selectedProduct.name}
            </p>
            <p style={{ fontSize: '18px', marginBottom: '16px' }}>
              <strong>当前库存：</strong>{selectedProduct.stock_quantity}
            </p>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '18px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
                变动类型
              </label>
              <Select
                size="large"
                style={{ width: '100%' }}
                value={adjustForm.changeType}
                onChange={(value) => setAdjustForm(prev => ({ ...prev, changeType: value }))}
              >
                <Option value="in">入库（增加）</Option>
                <Option value="out">出库（减少）</Option>
                <Option value="adjust">调整（正数增加，负数减少）</Option>
              </Select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '18px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
                变动数量
              </label>
              <InputNumber
                size="large"
                style={{ width: '100%' }}
                value={adjustForm.quantity}
                onChange={(value) => setAdjustForm(prev => ({ ...prev, quantity: value }))}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '18px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
                变动原因
              </label>
              <TextArea
                rows={3}
                value={adjustForm.reason}
                onChange={(e) => setAdjustForm(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="请输入变动原因（必填）"
                style={{ fontSize: '18px' }}
              />
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="库存变动日志"
        open={logsModalVisible}
        onCancel={() => setLogsModalVisible(false)}
        footer={[
          <Button key="close" size="large" onClick={() => setLogsModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={1000}
      >
        {selectedProduct && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '18px' }}>
              <strong>商品：</strong>{selectedProduct.name}
            </p>
          </div>
        )}
        <Table
          columns={logColumns}
          dataSource={logs}
          rowKey="id"
          pagination={false}
          size="middle"
          scroll={{ x: 1000, y: 400 }}
        />
      </Modal>

      <Modal
        title="库存预警列表"
        open={alertsModalVisible}
        onCancel={() => setAlertsModalVisible(false)}
        footer={[
          <Button key="close" size="large" onClick={() => setAlertsModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={1000}
      >
        <Table
          columns={alertColumns}
          dataSource={alerts}
          rowKey="id"
          pagination={false}
          size="middle"
          scroll={{ x: 1200, y: 400 }}
        />
      </Modal>
    </Card>
  );
};

export default Inventory;