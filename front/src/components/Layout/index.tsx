import React, { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Layout as AntLayout,
  Menu,
  Avatar,
  Dropdown,
  Button,
  Space,
  Badge,
} from 'antd'
import {
  DashboardOutlined,
  CalendarOutlined,
  ShoppingOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { useAuth } from '@/contexts/AuthContext'
import styles from './index.module.css'

const { Header, Sider, Content } = AntLayout

const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const { admin, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems: MenuProps['items'] = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '数据概览',
    },
    {
      key: '/events',
      icon: <CalendarOutlined />,
      label: '演出管理',
    },
    {
      key: '/orders',
      icon: <ShoppingOutlined />,
      label: '订单管理',
    },
  ]

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ]

  return (
    <AntLayout className={styles.layout}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className={styles.sider}
        width={220}
      >
        <div className={styles.logo}>
          <div className={styles.logoIcon}>🎭</div>
          {!collapsed && (
            <div className={styles.logoText}>
              <div>{admin?.tenantId === 'dt' ? '脱口秀俱乐部' : 'X俱乐部'}</div>
              <div className={styles.logoSubtext}>管理后台</div>
            </div>
          )}
        </div>
        
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      
      <AntLayout>
        <Header className={styles.header}>
          <div className={styles.headerLeft}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className={styles.trigger}
            />
          </div>
          
          <div className={styles.headerRight}>
            <Space size="middle">
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <div className={styles.userInfo}>
                  <Avatar
                    size="small"
                    icon={<UserOutlined />}
                    className={styles.avatar}
                  />
                  <span className={styles.username}>{admin?.username}</span>
                </div>
              </Dropdown>
            </Space>
          </div>
        </Header>
        
        <Content className={styles.content}>
          <div className={styles.contentWrapper}>
            <Outlet />
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  )
}

export default Layout