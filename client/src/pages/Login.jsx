import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      console.log('开始登录...', values);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      
      const data = await response.json();
      console.log('登录响应:', data);
      
      if (response.ok && data.success) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        
        message.success('登录成功！');
        navigate('/dashboard');
      } else {
        message.error(data.message || '登录失败');
      }
    } catch (error) {
      console.error('登录失败:', error);
      message.error('网络连接失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: 500,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          borderRadius: '16px'
        }}
        title={
          <div style={{ textAlign: 'center', fontSize: '28px', fontWeight: 'bold', color: '#1890ff' }}>
            超市商品管理平台
          </div>
        }
      >
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
          layout="vertical"
        >
          <Form.Item
            label={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>用户名</span>}
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined style={{ fontSize: '20px', color: '#1890ff' }} />}
              placeholder="请输入用户名"
              style={{ fontSize: '18px' }}
            />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>密码</span>}
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ fontSize: '20px', color: '#1890ff' }} />}
              placeholder="请输入密码"
              style={{ fontSize: '18px' }}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              style={{ fontSize: '20px', height: '56px', marginTop: '20px' }}
            >
              登 录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ 
          textAlign: 'center', 
          marginTop: '24px', 
          fontSize: '16px', 
          color: '#666' 
        }}>
          <p>忘记密码？请联系管理员重置</p>
        </div>
      </Card>
    </div>
  );
};

export default Login;