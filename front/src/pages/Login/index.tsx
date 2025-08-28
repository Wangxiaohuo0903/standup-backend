import React, { useState } from 'react'
import { Card, Form, Input, Button, Select, message } from 'antd'
import { UserOutlined, LockOutlined, HomeOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { adminLogin } from '@/services/auth'
import type { AdminLoginForm } from '@/types'
import styles from './index.module.css'

const { Option } = Select

const Login: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const from = location.state?.from?.pathname || '/dashboard'

  const handleSubmit = async (values: AdminLoginForm) => {
    try {
      setLoading(true)
      const response = await adminLogin(values)
      
      if (response.data) {
        login(response.data.admin, response.data.token)
        message.success('登录成功')
        navigate(from, { replace: true })
      }
    } catch (error) {
      // 错误已在request拦截器中处理
      console.error('Login failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginBox}>
        <div className={styles.header}>
          <h1>脱口秀票务管理后台</h1>
          <p>欢迎使用管理员系统</p>
        </div>
        
        <Card className={styles.loginCard}>
          <Form
            form={form}
            name="login"
            onFinish={handleSubmit}
            autoComplete="off"
            size="large"
          >
            <Form.Item
              name="tenantId"
              rules={[{ required: true, message: '请选择俱乐部' }]}
            >
              <Select
                prefix={<HomeOutlined />}
                placeholder="选择俱乐部"
                allowClear
              >
                <Option value="dt">脱口秀俱乐部</Option>
                <Option value="xclub">X俱乐部</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="用户名"
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="密码"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
              >
                登录
              </Button>
            </Form.Item>
          </Form>
        </Card>

        <div className={styles.footer}>
          <p>测试账号：admin / admin123</p>
          <p>支持俱乐部：dt, xclub</p>
        </div>
      </div>
    </div>
  )
}

export default Login