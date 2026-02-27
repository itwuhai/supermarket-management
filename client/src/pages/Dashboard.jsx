import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, message } from 'antd';
import {
  ShoppingOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  DollarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
import api from '../utils/api';

const Dashboard = () => {
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState({
    totalProducts: 0,
    totalSales: 0,
    totalRevenue: 0,
    lowStockCount: 0
  });
  const [recentSales, setRecentSales] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [productsRes, salesRes, inventoryRes] = await Promise.all([
        api.get('/products', { params: { pageSize: 1 } }),
        api.get('/sales/statistics'),
        api.get('/inventory', { params: { alertType: 'low', pageSize: 5 } })
      ]);

      if (productsRes.success) {
        setStatistics(prev => ({ ...prev, totalProducts: productsRes.data.total }));
      }

      if (salesRes.success) {
        setStatistics(prev => ({
          ...prev,
          totalSales: salesRes.data.summary.order_count || 0,
          totalRevenue: salesRes.data.summary.total_amount || 0
        }));
      }

      if (inventoryRes.success) {
        setLowStockProducts(inventoryRes.data.list);
        setStatistics(prev => ({ ...prev, lowStockCount: inventoryRes.data.total }));
      }

      const recentSalesRes = await api.get('/sales', { params: { pageSize: 5 } });
      if (recentSalesRes.success) {
        setRecentSales(recentSalesRes.data.list);
      }
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const salesColumns = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 150,
    },
    {
      title: '客户',
      dataIndex: 'customer_name',
      key: 'customer_name',
      width: 120,
      render: (text) => text || '-',
    },
    {
      title: '金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 120,
      render: (amount) => `¥${parseFloat(amount).toFixed(2)}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const statusMap = {
          pending: { text: '待处理', color: 'orange' },
          completed: { text: '已完成', color: 'green' },
          cancelled: { text: '已取消', color: 'red' },
          refunded: { text: '已退款', color: 'blue' },
        };
        const { text, color } = statusMap[status] || { text: status, color: 'default' };
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleString('zh-CN'),
    },
  ];

  const lowStockColumns = [
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '条码',
      dataIndex: 'barcode',
      key: 'barcode',
      width: 150,
    },
    {
      title: '当前库存',
      dataIndex: 'stock_quantity',
      key: 'stock_quantity',
      width: 120,
      render: (quantity) => (
        <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>{quantity}</span>
      ),
    },
    {
      title: '最小库存',
      dataIndex: 'min_stock',
      key: 'min_stock',
      width: 120,
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            style={{ 
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff'
            }}
          >
            <Statistic
              title="商品总数"
              value={statistics.totalProducts}
              prefix={<ShoppingOutlined style={{ fontSize: '32px', color: '#fff' }} />}
              valueStyle={{ color: '#fff' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            style={{ 
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: '#fff'
            }}
          >
            <Statistic
              title="销售订单"
              value={statistics.totalSales}
              prefix={<ShoppingCartOutlined style={{ fontSize: '32px', color: '#fff' }} />}
              valueStyle={{ color: '#fff' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            style={{ 
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: '#fff'
            }}
          >
            <Statistic
              title="总销售额"
              value={statistics.totalRevenue}
              precision={2}
              prefix={<DollarOutlined style={{ fontSize: '32px', color: '#fff' }} />}
              suffix="元"
              valueStyle={{ color: '#fff' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            style={{ 
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              color: '#fff'
            }}
          >
            <Statistic
              title="库存预警"
              value={statistics.lowStockCount}
              prefix={<InboxOutlined style={{ fontSize: '32px', color: '#fff' }} />}
              valueStyle={{ color: statistics.lowStockCount > 0 ? '#fff' : '#fff' }}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
        <Col xs={24} lg={12}>
          <Card 
            title={<span style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>最近销售订单</span>}
            extra={<Tag color="blue" style={{ fontSize: '14px' }}>最新5笔</Tag>}
            style={{ 
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
            }}
          >
            <Table
              columns={salesColumns}
              dataSource={recentSales}
              rowKey="id"
              loading={loading}
              pagination={false}
              size="middle"
              style={{ borderRadius: '6px' }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card 
            title={<span style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>库存预警商品</span>}
            extra={<Tag color="red" style={{ fontSize: '14px' }}>需要补货</Tag>}
            style={{ 
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
            }}
          >
            <Table
              columns={lowStockColumns}
              dataSource={lowStockProducts}
              rowKey="id"
              loading={loading}
              pagination={false}
              size="middle"
              style={{ borderRadius: '6px' }}
            />
          </Card>
        </Col>
      </Row>

      {statistics.lowStockCount > 0 && (
        <Card 
          style={{ 
            marginTop: '24px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            color: '#fff'
          }}
          message={<span style={{ color: '#fff', fontSize: '16px' }}>有 {statistics.lowStockCount} 个商品库存不足，请及时补货</span>}
          showIcon
        />
      )}
    </div>
  );
};

export default Dashboard;