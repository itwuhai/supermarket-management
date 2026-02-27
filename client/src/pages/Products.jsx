import React, { useEffect, useState } from 'react';
import { Table, Button, Input, Space, Tag, Modal, message, Card, Select } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const { Search } = Input;
const { Option } = Select;

const Products = () => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [filters, setFilters] = useState({ keyword: '', categoryId: '', status: '' });
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [pagination.current, pagination.pageSize, filters]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/products', {
        params: {
          page: pagination.current,
          pageSize: pagination.pageSize,
          keyword: filters.keyword,
          categoryId: filters.categoryId,
          status: filters.status
        }
      });

      if (response.success) {
        setProducts(response.data.list);
        setPagination(prev => ({ ...prev, total: response.data.total }));
      }
    } catch (error) {
      console.error('获取商品列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/products/categories');
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('获取分类列表失败:', error);
    }
  };

  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, keyword: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleCategoryChange = (value) => {
    setFilters(prev => ({ ...prev, categoryId: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleStatusChange = (value) => {
    setFilters(prev => ({ ...prev, status: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleAdd = () => {
    navigate('/products/new');
  };

  const handleEdit = (record) => {
    navigate(`/products/${record.id}/edit`);
  };

  const handleDelete = (record) => {
    setSelectedProduct(record);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await api.delete(`/products/${selectedProduct.id}`);
      if (response.success) {
        message.success('删除成功');
        setDeleteModalVisible(false);
        fetchProducts();
      }
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  const columns = [
    {
      title: '条码',
      dataIndex: 'barcode',
      key: 'barcode',
      width: 140,
      fixed: 'left',
    },
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
    },
    {
      title: '分类',
      dataIndex: 'category_name',
      key: 'category_name',
      width: 120,
      render: (text) => text || '-',
    },
    {
      title: '品牌',
      dataIndex: 'brand',
      key: 'brand',
      width: 120,
      render: (text) => text || '-',
    },
    {
      title: '进货价',
      dataIndex: 'purchase_price',
      key: 'purchase_price',
      width: 100,
      render: (price) => `¥${parseFloat(price).toFixed(2)}`,
    },
    {
      title: '销售价',
      dataIndex: 'sale_price',
      key: 'sale_price',
      width: 100,
      render: (price) => <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>¥{parseFloat(price).toFixed(2)}</span>,
    },
    {
      title: '库存',
      dataIndex: 'stock_quantity',
      key: 'stock_quantity',
      width: 100,
      render: (quantity, record) => {
        const isLow = quantity <= record.min_stock;
        return (
          <span style={{ color: isLow ? '#ff4d4f' : '#52c41a', fontWeight: 'bold' }}>
            {quantity}
          </span>
        );
      },
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const statusMap = {
          active: { text: '在售', color: 'green' },
          inactive: { text: '停售', color: 'red' },
          out_of_stock: { text: '缺货', color: 'orange' },
        };
        const { text, color } = statusMap[status] || { text: status, color: 'default' };
        return <Tag color={color}>{text}</Tag>;
      },
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
            icon={<EditOutlined />}
            size="large"
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            size="large"
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      ),
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
              placeholder="选择分类"
              allowClear
              size="large"
              style={{ width: 150 }}
              onChange={handleCategoryChange}
              value={filters.categoryId || undefined}
            >
              {categories.map(cat => (
                <Option key={cat.id} value={cat.id}>{cat.name}</Option>
              ))}
            </Select>
            <Select
              placeholder="选择状态"
              allowClear
              size="large"
              style={{ width: 150 }}
              onChange={handleStatusChange}
              value={filters.status || undefined}
            >
              <Option value="active">在售</Option>
              <Option value="inactive">停售</Option>
              <Option value="out_of_stock">缺货</Option>
            </Select>
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
              添加商品
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
            dataSource={products}
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
        title="确认删除"
        open={deleteModalVisible}
        onOk={confirmDelete}
        onCancel={() => setDeleteModalVisible(false)}
        okText="确认删除"
        cancelText="取消"
      >
        <p style={{ fontSize: '18px' }}>
          确定要删除商品 <strong>{selectedProduct?.name}</strong> 吗？
        </p>
        <p style={{ fontSize: '16px', color: '#ff4d4f' }}>
          此操作将把商品状态设置为停售，不会删除历史数据。
        </p>
      </Modal>
    </Card>
  );
};

export default Products;