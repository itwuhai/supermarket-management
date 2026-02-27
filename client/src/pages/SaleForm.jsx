import React, { useEffect, useState } from 'react';
import { Form, Input, Select, Button, Card, Table, message, Space, Modal, InputNumber } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, DeleteOutlined, SaveOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';

const { Option } = Select;
const { Search } = Input;

const SaleForm = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      fetchSaleDetail();
    }
  }, [id]);

  const fetchSaleDetail = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/sales/${id}`);
      if (response.success) {
        const order = response.data.order;
        const items = response.data.items;
        
        form.setFieldsValue({
          customerName: order.customer_name,
          customerPhone: order.customer_phone,
          paymentMethod: order.payment_method,
          remark: order.remark
        });

        const cartItems = items.map(item => ({
          productId: item.product_id,
          productName: item.product_name,
          barcode: item.barcode,
          unitPrice: item.unit_price,
          quantity: item.quantity,
          subtotal: item.subtotal,
          discount: item.discount || 0
        }));

        setCart(cartItems);
      }
    } catch (error) {
      console.error('获取订单详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchProducts = async (keyword) => {
    if (!keyword) return;
    
    try {
      const response = await api.get('/products', {
        params: { keyword, pageSize: 20, status: 'active' }
      });

      if (response.success) {
        setProducts(response.data.list);
        setProductModalVisible(true);
      }
    } catch (error) {
      console.error('搜索商品失败:', error);
    }
  };

  const handleSearch = (value) => {
    setSearchKeyword(value);
    if (value.length >= 2) {
      searchProducts(value);
    }
  };

  const handleAddToCart = (product) => {
    const existingItem = cart.find(item => item.productId === product.id);
    
    if (existingItem) {
      message.info('商品已在购物车中');
      return;
    }

    const newItem = {
      id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      productId: product.id,
      productName: product.name,
      barcode: product.barcode,
      unitPrice: product.sale_price,
      quantity: 1,
      subtotal: product.sale_price,
      discount: 0
    };

    setCart([...cart, newItem]);
    setProductModalVisible(false);
    setSearchKeyword('');
  };

  const handleRemoveFromCart = (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
  };

  const handleQuantityChange = (index, value) => {
    const newCart = [...cart];
    newCart[index].quantity = value;
    newCart[index].subtotal = newCart[index].unitPrice * value - (newCart[index].discount || 0);
    setCart(newCart);
  };

  const handleDiscountChange = (index, value) => {
    const newCart = [...cart];
    newCart[index].discount = value || 0;
    newCart[index].subtotal = newCart[index].unitPrice * newCart[index].quantity - (value || 0);
    setCart(newCart);
  };

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + parseFloat(item.subtotal || 0), 0);
  };

  const onFinish = async (values) => {
    if (cart.length === 0) {
      message.warning('购物车为空，请先添加商品');
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        ...values,
        items: cart
      };

      let response;
      if (id) {
        message.info('编辑订单功能暂未开放');
        return;
      } else {
        response = await api.post('/sales', data);
      }

      if (response.success) {
        message.success('销售成功！');
        navigate('/sales');
      }
    } catch (error) {
      console.error('保存失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: '商品名称',
      dataIndex: 'productName',
      key: 'productName',
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
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 100,
      render: (price) => `¥${parseFloat(price).toFixed(2)}`,
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      render: (quantity, record, index) => (
        <InputNumber
          min={1}
          value={quantity}
          onChange={(value) => handleQuantityChange(index, value)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '折扣',
      dataIndex: 'discount',
      key: 'discount',
      width: 100,
      render: (discount, record, index) => (
        <Space.Compact style={{ width: '100%' }}>
          <Input style={{ width: '40px', textAlign: 'center', pointerEvents: 'none' }} defaultValue="¥" readOnly />
          <InputNumber
            min={0}
            value={discount}
            onChange={(value) => handleDiscountChange(index, value)}
            style={{ width: 'calc(100% - 40px)' }}
          />
        </Space.Compact>
      ),
    },
    {
      title: '小计',
      dataIndex: 'subtotal',
      key: 'subtotal',
      width: 120,
      render: (amount) => <span style={{ color: '#ff4d4f', fontWeight: 'bold', fontSize: '18px' }}>¥{parseFloat(amount).toFixed(2)}</span>,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record, index) => (
        <Button
          danger
          icon={<DeleteOutlined />}
          size="large"
          onClick={() => handleRemoveFromCart(index)}
        >
          删除
        </Button>
      ),
    },
  ];

  const productColumns = [
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
      width: 140,
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
      width: 80,
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
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => handleAddToCart(record)}
        >
          添加
        </Button>
      ),
    },
  ];

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/sales')}
            style={{ marginRight: '16px' }}
          >
            返回
          </Button>
          <span style={{ fontSize: '22px' }}>
            {id ? '编辑销售订单' : '新建销售'}
          </span>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        size="large"
      >
        <div style={{ marginBottom: '24px' }}>
          <Space size="middle">
            <Search
              placeholder="搜索商品名称或条码"
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              style={{ width: 400 }}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onSearch={handleSearch}
            />
            <span style={{ fontSize: '18px', color: '#666' }}>
              提示：输入至少2个字符进行搜索
            </span>
          </Space>
        </div>

        <div style={{ marginBottom: '24px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '20px', marginBottom: '16px' }}>客户信息</h3>
          </div>
          <Space size="large">
            <Form.Item
              label={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>客户姓名</span>}
              name="customerName"
            >
              <Input placeholder="请输入客户姓名（可选）" style={{ width: 200, fontSize: '18px' }} />
            </Form.Item>
            <Form.Item
              label={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>联系电话</span>}
              name="customerPhone"
            >
              <Input placeholder="请输入联系电话（可选）" style={{ width: 200, fontSize: '18px' }} />
            </Form.Item>
            <Form.Item
              label={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>支付方式</span>}
              name="paymentMethod"
              initialValue="cash"
              rules={[{ required: true, message: '请选择支付方式' }]}
            >
              <Select style={{ width: 150 }}>
                <Option value="cash">现金</Option>
                <Option value="card">刷卡</Option>
                <Option value="wechat">微信</Option>
                <Option value="alipay">支付宝</Option>
                <Option value="other">其他</Option>
              </Select>
            </Form.Item>
          </Space>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '20px', marginBottom: '16px' }}>购物车</h3>
          <Table
            columns={columns}
            dataSource={cart}
            rowKey="id"
            pagination={false}
            size="middle"
            scroll={{ x: 1200 }}
          />
        </div>

        <div style={{ 
          marginBottom: '24px', 
          padding: '24px', 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '12px',
          color: 'white'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '20px' }}>订单总金额</span>
            <span style={{ fontSize: '36px', fontWeight: 'bold' }}>¥{getTotalAmount().toFixed(2)}</span>
          </div>
        </div>

        <Form.Item
          label={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>备注</span>}
          name="remark"
        >
          <Input.TextArea
            placeholder="请输入备注信息（可选）"
            rows={3}
            style={{ fontSize: '18px' }}
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={submitting}
            size="large"
            style={{ fontSize: '20px', height: '56px', minWidth: '200px' }}
          >
            完成销售
          </Button>
        </Form.Item>
      </Form>

      <Modal
        title="选择商品"
        open={productModalVisible}
        onCancel={() => setProductModalVisible(false)}
        footer={null}
        width={900}
      >
        <Table
          columns={productColumns}
          dataSource={products}
          rowKey="id"
          pagination={false}
          size="middle"
          scroll={{ y: 400 }}
        />
      </Modal>
    </Card>
  );
};

export default SaleForm;