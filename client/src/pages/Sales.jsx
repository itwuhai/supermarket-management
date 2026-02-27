import React, { useEffect, useState } from 'react';
import { Table, Button, Input, Space, Tag, Modal, message, Card, DatePicker, Select } from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined, StopOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../utils/api';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const Sales = () => {
  const [loading, setLoading] = useState(false);
  const [sales, setSales] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [filters, setFilters] = useState({ keyword: '', status: '', startDate: '', endDate: '' });
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [saleItems, setSaleItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSales();
  }, [pagination.current, pagination.pageSize, filters]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const response = await api.get('/sales', {
        params: {
          page: pagination.current,
          pageSize: pagination.pageSize,
          status: filters.status,
          startDate: filters.startDate,
          endDate: filters.endDate
        }
      });

      if (response.success) {
        setSales(response.data.list);
        setPagination(prev => ({ ...prev, total: response.data.total }));
      }
    } catch (error) {
      console.error('获取销售列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, keyword: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleStatusChange = (value) => {
    setFilters(prev => ({ ...prev, status: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleDateRangeChange = (dates) => {
    if (dates && dates.length === 2) {
      setFilters(prev => ({
        ...prev,
        startDate: dates[0].format('YYYY-MM-DD'),
        endDate: dates[1].format('YYYY-MM-DD')
      }));
    } else {
      setFilters(prev => ({ ...prev, startDate: '', endDate: '' }));
    }
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleAdd = () => {
    navigate('/sales/new');
  };

  const handleViewDetail = async (record) => {
    try {
      const response = await api.get(`/sales/${record.id}`);
      if (response.success) {
        setSelectedSale(response.data.order);
        setSaleItems(response.data.items);
        setDetailModalVisible(true);
      }
    } catch (error) {
      console.error('获取订单详情失败:', error);
    }
  };

  const handleCancel = (record) => {
    setSelectedSale(record);
    setCancelModalVisible(true);
  };

  const confirmCancel = async () => {
    try {
      const response = await api.put(`/sales/${selectedSale.id}/cancel`);
      if (response.success) {
        message.success('订单取消成功');
        setCancelModalVisible(false);
        fetchSales();
      }
    } catch (error) {
      console.error('取消订单失败:', error);
    }
  };

  const columns = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 180,
      fixed: 'left',
    },
    {
      title: '客户姓名',
      dataIndex: 'customer_name',
      key: 'customer_name',
      width: 120,
      render: (text) => text || '-',
    },
    {
      title: '联系电话',
      dataIndex: 'customer_phone',
      key: 'customer_phone',
      width: 130,
      render: (text) => text || '-',
    },
    {
      title: '订单金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 120,
      render: (amount) => <span style={{ color: '#ff4d4f', fontWeight: 'bold', fontSize: '18px' }}>¥{parseFloat(amount).toFixed(2)}</span>,
    },
    {
      title: '支付方式',
      dataIndex: 'payment_method',
      key: 'payment_method',
      width: 100,
      render: (method) => {
        const methodMap = {
          cash: '现金',
          card: '刷卡',
          wechat: '微信',
          alipay: '支付宝',
          other: '其他'
        };
        return methodMap[method] || method;
      },
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
      title: '操作员',
      dataIndex: 'operator_name',
      key: 'operator_name',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="large"
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {record.status === 'completed' && (
            <Button
              danger
              icon={<StopOutlined />}
              size="large"
              onClick={() => handleCancel(record)}
            >
              取消
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const itemColumns = [
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
      title: '单价',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 100,
      render: (price) => `¥${parseFloat(price).toFixed(2)}`,
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      render: (qty) => <span style={{ fontWeight: 'bold' }}>{qty}</span>,
    },
    {
      title: '小计',
      dataIndex: 'subtotal',
      key: 'subtotal',
      width: 120,
      render: (amount) => <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>¥{parseFloat(amount).toFixed(2)}</span>,
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
              placeholder="搜索订单号和客户信息几个字"
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              style={{ width: 350 }}
              onSearch={handleSearch}
            />
            <Select
              placeholder="选择状态"
              allowClear
              size="large"
              style={{ width: 150 }}
              onChange={handleStatusChange}
              value={filters.status || undefined}
            >
              <Option value="pending">待处理</Option>
              <Option value="completed">已完成</Option>
              <Option value="cancelled">已取消</Option>
              <Option value="refunded">已退款</Option>
            </Select>
            <RangePicker
              size="large"
              onChange={handleDateRangeChange}
              placeholder={['开始日期', '结束日期']}
              style={{ width: 280 }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '6px'
              }}
              onClick={handleAdd}
            >
              新建销售
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
            dataSource={sales}
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
        title="订单详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" size="large" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={900}
      >
        {selectedSale && (
          <div>
            <div style={{ marginBottom: '20px', fontSize: '18px' }}>
              <p><strong>订单号：</strong>{selectedSale.order_no}</p>
              <p><strong>客户姓名：</strong>{selectedSale.customer_name || '-'}</p>
              <p><strong>联系电话：</strong>{selectedSale.customer_phone || '-'}</p>
              <p><strong>支付方式：</strong>{selectedSale.payment_method === 'cash' ? '现金' : selectedSale.payment_method}</p>
              <p><strong>订单金额：</strong><span style={{ color: '#ff4d4f', fontWeight: 'bold', fontSize: '20px' }}>¥{parseFloat(selectedSale.total_amount).toFixed(2)}</span></p>
              <p><strong>备注：</strong>{selectedSale.remark || '-'}</p>
            </div>
            <Table
              columns={itemColumns}
              dataSource={saleItems}
              rowKey="id"
              pagination={false}
              size="middle"
            />
          </div>
        )}
      </Modal>

      <Modal
        title="确认取消订单"
        open={cancelModalVisible}
        onOk={confirmCancel}
        onCancel={() => setCancelModalVisible(false)}
        okText="确认取消"
        cancelText="返回"
      >
        <p style={{ fontSize: '18px' }}>
          确定要取消订单 <strong>{selectedSale?.order_no}</strong> 吗？
        </p>
        <p style={{ fontSize: '16px', color: '#ff4d4f' }}>
          取消后，订单中的商品库存将自动恢复。
        </p>
      </Modal>
    </Card>
  );
};

export default Sales;