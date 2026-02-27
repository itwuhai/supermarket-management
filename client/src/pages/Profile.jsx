import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Button, message, Descriptions, Avatar } from 'antd';
import { UserOutlined, LockOutlined, SaveOutlined } from '@ant-design/icons';
import api from '../utils/api';

const Profile = () => {
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await api.get('/auth/profile');
      if (response.success) {
        setUser(response.data);
        form.setFieldsValue({
          username: response.data.username,
          realName: response.data.real_name,
          phone: response.data.phone
        });
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (values) => {
    try {
      const response = await api.put('/auth/profile', values);
      if (response.success) {
        message.success('个人信息更新成功');
        fetchProfile();
      }
    } catch (error) {
      console.error('更新个人信息失败:', error);
    }
  };

  const handleChangePassword = async (values) => {
    setPasswordLoading(true);
    try {
      const response = await api.post('/auth/change-password', values);
      if (response.success) {
        message.success('密码修改成功，请重新登录');
        passwordForm.resetFields();
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }, 1500);
      }
    } catch (error) {
      console.error('修改密码失败:', error);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Avatar 
              size="large" 
              icon={<UserOutlined />} 
              style={{ backgroundColor: '#1890ff', marginRight: '16px' }}
            />
            <span style={{ fontSize: '24px' }}>个人信息</span>
          </div>
        }
        style={{ marginBottom: '24px' }}
      >
        {user && (
          <Descriptions column={2} size="large">
            <Descriptions.Item label={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>用户名</span>}>
              <span style={{ fontSize: '18px' }}>{user.username}</span>
            </Descriptions.Item>
            <Descriptions.Item label={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>真实姓名</span>}>
              <span style={{ fontSize: '18px' }}>{user.real_name}</span>
            </Descriptions.Item>
            <Descriptions.Item label={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>联系电话</span>}>
              <span style={{ fontSize: '18px' }}>{user.phone || '-'}</span>
            </Descriptions.Item>
            <Descriptions.Item label={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>角色</span>}>
              <span style={{ fontSize: '18px' }}>
                {user.role === 'admin' ? '管理员' : user.role === 'manager' ? '经理' : '员工'}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>状态</span>}>
              <span style={{ fontSize: '18px', color: user.status === 'active' ? '#52c41a' : '#ff4d4f' }}>
                {user.status === 'active' ? '激活' : '停用'}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>最后登录</span>}>
              <span style={{ fontSize: '18px' }}>
                {user.last_login ? new Date(user.last_login).toLocaleString('zh-CN') : '-'}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>注册时间</span>}>
              <span style={{ fontSize: '18px' }}>
                {new Date(user.created_at).toLocaleString('zh-CN')}
              </span>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Card>

      <Card
        title={<span style={{ fontSize: '22px' }}>修改个人信息</span>}
        style={{ marginBottom: '24px' }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateProfile}
          size="large"
        >
          <Form.Item
            label={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>真实姓名</span>}
            name="realName"
            rules={[{ required: true, message: '请输入真实姓名' }]}
          >
            <Input placeholder="请输入真实姓名" style={{ fontSize: '18px' }} />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>联系电话</span>}
            name="phone"
          >
            <Input placeholder="请输入联系电话" style={{ fontSize: '18px' }} />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading}
              size="large"
              style={{ fontSize: '20px', height: '56px', minWidth: '200px' }}
            >
              保存修改
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card
        title={<span style={{ fontSize: '22px' }}>修改密码</span>}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleChangePassword}
          size="large"
        >
          <Form.Item
            label={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>原密码</span>}
            name="oldPassword"
            rules={[{ required: true, message: '请输入原密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ fontSize: '20px', color: '#1890ff' }} />}
              placeholder="请输入原密码"
              style={{ fontSize: '18px' }}
            />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>新密码</span>}
            name="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6位' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ fontSize: '20px', color: '#1890ff' }} />}
              placeholder="请输入新密码（至少6位）"
              style={{ fontSize: '18px' }}
            />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>确认新密码</span>}
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ fontSize: '20px', color: '#1890ff' }} />}
              placeholder="请再次输入新密码"
              style={{ fontSize: '18px' }}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={passwordLoading}
              size="large"
              style={{ fontSize: '20px', height: '56px', minWidth: '200px' }}
            >
              修改密码
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Profile;