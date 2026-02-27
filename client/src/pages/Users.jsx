import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Card, Space, Tag, Alert, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, StopOutlined, UserOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../utils/api';

const { Option } = Select;

const Users = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/auth/users');
      if (response.success) {
        setUsers(response.data.list || []);
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingUser(record);
    form.setFieldsValue({
      username: record.username,
      realName: record.real_name,
      phone: record.phone,
      role: record.role,
      status: record.status
    });
    setModalVisible(true);
  };

  const handleToggleStatus = async (record) => {
    const newStatus = record.status === 'active' ? 'inactive' : 'active';
    try {
      const response = await api.put(`/auth/users/${record.id}/status`, { status: newStatus });
      if (response.success) {
        message.success('状态更新成功');
        fetchUsers();
      }
    } catch (error) {
      console.error('更新状态失败:', error);
    }
  };

  const handleDelete = async (record) => {
    try {
      const response = await api.delete(`/auth/users/${record.id}`);
      if (response.success) {
        message.success('删除成功');
        fetchUsers();
      }
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingUser) {
        const updateData = { ...values };
        if (!updateData.password) {
          delete updateData.password;
        }
        const response = await api.put(`/auth/users/${editingUser.id}`, updateData);
        if (response.success) {
          message.success('更新成功');
          setModalVisible(false);
          fetchUsers();
        }
      } else {
        const response = await api.post('/auth/users', values);
        if (response.success) {
          message.success('创建成功');
          setModalVisible(false);
          fetchUsers();
        }
      }
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 150,
    },
    {
      title: '真实姓名',
      dataIndex: 'real_name',
      key: 'real_name',
      width: 150,
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
      render: (text) => text || '-',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role) => {
        const roleMap = {
          admin: { text: '管理员', color: 'red' },
          manager: { text: '经理', color: 'orange' },
          staff: { text: '员工', color: 'blue' },
        };
        const { text, color } = roleMap[role] || { text: role, color: 'default' };
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const statusMap = {
          active: { text: '激活', color: 'green' },
          inactive: { text: '停用', color: 'red' },
        };
        const { text, color } = statusMap[status] || { text: status, color: 'default' };
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '最后登录',
      dataIndex: 'last_login',
      key: 'last_login',
      width: 180,
      render: (date) => date ? new Date(date).toLocaleString('zh-CN') : '-',
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
      width: 280,
      render: (_, record) => {
        const canEdit = currentUser && (
          currentUser.role === 'admin' || 
          currentUser.role === 'manager'
        );
        const canToggleStatus = currentUser && (
          currentUser.role === 'admin' || 
          currentUser.role === 'manager'
        );
        const canDelete = currentUser && (
          currentUser.role === 'admin' || 
          (currentUser.role === 'manager' && record.role !== 'admin')
        );
        
        return (
          <Space size="small">
            {canEdit && (
              <Button
                type="primary"
                icon={<EditOutlined />}
                size="large"
                onClick={() => handleEdit(record)}
              >
                编辑
              </Button>
            )}
            {canToggleStatus && (
              <Button
                danger={record.status === 'active'}
                type={record.status === 'inactive' ? 'primary' : 'default'}
                icon={<StopOutlined />}
                size="large"
                onClick={() => handleToggleStatus(record)}
              >
                {record.status === 'active' ? '停用' : '激活'}
              </Button>
            )}
            {canDelete && (
              <Popconfirm
                title="确定要删除这个用户吗？"
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
            )}
          </Space>
        );
      },
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
        {currentUser && currentUser.role !== 'staff' && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.95)', 
            padding: '20px', 
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
          }}>
            <h2 style={{ fontSize: '24px', margin: 0 }}>用户管理</h2>
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
              添加用户
            </Button>
          </div>
        )}
        {currentUser && currentUser.role === 'staff' && (
          <Alert
            message="您没有权限访问用户管理功能"
            type="warning"
            style={{ marginBottom: '16px' }}
          />
        )}
        {currentUser && currentUser.role !== 'staff' && (
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.95)', 
            padding: '20px', 
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
          }}>
            <Table
              columns={columns}
              dataSource={users}
              rowKey="id"
              loading={loading}
              pagination={false}
              size="middle"
              scroll={{ x: 1200 }}
              style={{ borderRadius: '6px' }}
            />
          </div>
        )}
      </Space>

      <Modal
        title={editingUser ? '编辑用户' : '添加用户'}
        open={modalVisible}
        onOk={handleOk}
        onCancel={() => setModalVisible(false)}
        okText="保存"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical" size="large">
          <Form.Item
            label={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>用户名</span>}
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" style={{ fontSize: '18px' }} disabled={!!editingUser} />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>密码</span>}
            name="password"
            rules={editingUser ? [] : [
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6位' }
            ]}
          >
            <Input.Password placeholder={editingUser ? '留空则不修改密码' : '请输入密码（至少6位）'} style={{ fontSize: '18px' }} />
          </Form.Item>

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

          <Form.Item
            label={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>角色</span>}
            name="role"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色" size="large">
              {currentUser && currentUser.role === 'admin' && (
                <Option value="admin">管理员</Option>
              )}
              <Option value="manager">经理</Option>
              <Option value="staff">员工</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>状态</span>}
            name="status"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态" size="large">
              <Option value="active">激活</Option>
              <Option value="inactive">停用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default Users;