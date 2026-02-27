import React, { useEffect, useState } from 'react';
import { Form, Input, InputNumber, Select, Button, Card, message, Spin, Space } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';

const { Option } = Select;
const { TextArea } = Input;

const ProductForm = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isEdit, setIsEdit] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    fetchCategories();
    if (id) {
      setIsEdit(true);
      fetchProduct();
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/products/categories');
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('获取分类失败:', error);
    }
  };

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/products/${id}`);
      if (response.success) {
        const product = response.data;
        form.setFieldsValue({
          barcode: product.barcode,
          name: product.name,
          categoryId: product.category_id,
          brand: product.brand,
          unit: product.unit,
          purchasePrice: product.purchase_price,
          salePrice: product.sale_price,
          stockQuantity: product.stock_quantity,
          minStock: product.min_stock,
          maxStock: product.max_stock,
          shelfLife: product.shelf_life,
          productionDate: product.production_date,
          supplier: product.supplier,
          description: product.description,
          imageUrl: product.image_url,
          status: product.status
        });
      }
    } catch (error) {
      console.error('获取商品详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      const data = {
        ...values,
        productionDate: values.productionDate || null
      };

      let response;
      if (isEdit) {
        response = await api.put(`/products/${id}`, data);
      } else {
        response = await api.post('/products', data);
      }

      if (response.success) {
        message.success(isEdit ? '更新成功' : '创建成功');
        navigate('/products');
      }
    } catch (error) {
      console.error('保存失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/products')}
            style={{ marginRight: '16px' }}
          >
            返回
          </Button>
          <span style={{ fontSize: '22px' }}>
            {isEdit ? '编辑商品' : '添加商品'}
          </span>
        </div>
      }
    >
      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            label={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>商品条码</span>}
            name="barcode"
            rules={[
              { required: true, message: '请输入商品条码' },
              { pattern: /^[0-9]+$/, message: '条码只能包含数字' }
            ]}
          >
            <Input placeholder="请输入商品条码（数字）" style={{ fontSize: '18px' }} />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>商品名称</span>}
            name="name"
            rules={[{ required: true, message: '请输入商品名称' }]}
          >
            <Input placeholder="请输入商品名称" style={{ fontSize: '18px' }} />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>商品分类</span>}
            name="categoryId"
            rules={[{ required: true, message: '请选择商品分类' }]}
          >
            <Select placeholder="请选择商品分类" size="large">
              {categories.map(cat => (
                <Option key={cat.id} value={cat.id}>{cat.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>品牌</span>}
            name="brand"
          >
            <Input placeholder="请输入品牌" style={{ fontSize: '18px' }} />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>计量单位</span>}
            name="unit"
            initialValue="件"
          >
            <Select placeholder="请选择计量单位" size="large">
              <Option value="件">件</Option>
              <Option value="个">个</Option>
              <Option value="盒">盒</Option>
              <Option value="箱">箱</Option>
              <Option value="包">包</Option>
              <Option value="瓶">瓶</Option>
              <Option value="袋">袋</Option>
              <Option value="斤">斤</Option>
              <Option value="公斤">公斤</Option>
              <Option value="克">克</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>进货价</span>}
            name="purchasePrice"
            rules={[{ required: true, message: '请输入进货价' }]}
          >
            <Space.Compact style={{ width: '100%' }}>
              <Input style={{ width: '40px', textAlign: 'center', pointerEvents: 'none' }} defaultValue="¥" readOnly />
              <InputNumber
                placeholder="请输入进货价"
                min={0}
                precision={2}
                style={{ width: 'calc(100% - 40px)', fontSize: '18px' }}
              />
            </Space.Compact>
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>销售价</span>}
            name="salePrice"
            rules={[{ required: true, message: '请输入销售价' }]}
          >
            <Space.Compact style={{ width: '100%' }}>
              <Input style={{ width: '40px', textAlign: 'center', pointerEvents: 'none' }} defaultValue="¥" readOnly />
              <InputNumber
                placeholder="请输入销售价"
                min={0}
                precision={2}
                style={{ width: 'calc(100% - 40px)', fontSize: '18px' }}
              />
            </Space.Compact>
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>初始库存</span>}
            name="stockQuantity"
            rules={[{ required: true, message: '请输入初始库存' }]}
            initialValue={0}
          >
            <InputNumber
              placeholder="请输入初始库存"
              min={0}
              style={{ width: '100%', fontSize: '18px' }}
            />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>最小库存预警值</span>}
            name="minStock"
            rules={[{ required: true, message: '请输入最小库存预警值' }]}
            initialValue={10}
          >
            <InputNumber
              placeholder="请输入最小库存预警值"
              min={0}
              style={{ width: '100%', fontSize: '18px' }}
            />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>最大库存值</span>}
            name="maxStock"
            rules={[{ required: true, message: '请输入最大库存值' }]}
            initialValue={1000}
          >
            <InputNumber
              placeholder="请输入最大库存值"
              min={0}
              style={{ width: '100%', fontSize: '18px' }}
            />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>保质期（天）</span>}
            name="shelfLife"
          >
            <InputNumber
              placeholder="请输入保质期"
              min={0}
              style={{ width: '100%', fontSize: '18px' }}
            />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>生产日期</span>}
            name="productionDate"
          >
            <Input type="date" style={{ fontSize: '18px' }} />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>供应商</span>}
            name="supplier"
          >
            <Input placeholder="请输入供应商" style={{ fontSize: '18px' }} />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>商品描述</span>}
            name="description"
          >
            <TextArea
              placeholder="请输入商品描述"
              rows={4}
              style={{ fontSize: '18px' }}
            />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>商品图片URL</span>}
            name="imageUrl"
          >
            <Input placeholder="请输入商品图片URL" style={{ fontSize: '18px' }} />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>状态</span>}
            name="status"
            initialValue="active"
          >
            <Select size="large">
              <Option value="active">在售</Option>
              <Option value="inactive">停售</Option>
              <Option value="out_of_stock">缺货</Option>
            </Select>
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
              保存商品
            </Button>
          </Form.Item>
        </Form>
      </Spin>
    </Card>
  );
};

export default ProductForm;