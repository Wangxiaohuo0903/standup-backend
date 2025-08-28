import React, { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Select,
  Spin,
  Typography,
} from 'antd'
import {
  CalendarOutlined,
  ShoppingOutlined,
  DollarOutlined,
  UserOutlined,
  TrendingUpOutlined,
} from '@ant-design/icons'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAuth } from '@/contexts/AuthContext'
import { getStats } from '@/services/stats'
import type { StatsData } from '@/types'
import styles from './index.module.css'

const { Title } = Typography
const { Option } = Select

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'today' | 'thisWeek' | 'thisMonth' | 'thisYear'>('thisMonth')
  const { admin } = useAuth()

  const fetchStats = async () => {
    if (!admin?.tenantId) return
    
    try {
      setLoading(true)
      const response = await getStats({
        tenantId: admin.tenantId,
        period,
      })
      
      if (response.data) {
        setStats(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [admin?.tenantId, period])

  // 模拟趋势数据
  const trendData = [
    { date: '12-01', orders: 12, revenue: 2400 },
    { date: '12-02', orders: 19, revenue: 3800 },
    { date: '12-03', orders: 15, revenue: 3000 },
    { date: '12-04', orders: 23, revenue: 4600 },
    { date: '12-05', orders: 18, revenue: 3600 },
    { date: '12-06', orders: 25, revenue: 5000 },
    { date: '12-07', orders: 22, revenue: 4400 },
  ]

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <Title level={2}>数据概览</Title>
        <Select
          value={period}
          onChange={setPeriod}
          style={{ width: 120 }}
        >
          <Option value="today">今天</Option>
          <Option value="thisWeek">本周</Option>
          <Option value="thisMonth">本月</Option>
          <Option value="thisYear">本年</Option>
        </Select>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} className={styles.statsRow}>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.statCard}>
            <Statistic
              title="总演出数"
              value={stats?.totalEvents || 0}
              prefix={<CalendarOutlined className={styles.statIcon} />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div className={styles.statExtra}>
              本期新增: {stats?.thisMonth?.events || 0}
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.statCard}>
            <Statistic
              title="总订单数"
              value={stats?.totalOrders || 0}
              prefix={<ShoppingOutlined className={styles.statIcon} />}
              valueStyle={{ color: '#52c41a' }}
            />
            <div className={styles.statExtra}>
              本期新增: {stats?.thisMonth?.orders || 0}
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.statCard}>
            <Statistic
              title="总收入"
              value={stats?.totalRevenue || 0}
              precision={2}
              prefix={<DollarOutlined className={styles.statIcon} />}
              suffix="元"
              valueStyle={{ color: '#fa8c16' }}
            />
            <div className={styles.statExtra}>
              本期收入: ¥{stats?.thisMonth?.revenue || 0}
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.statCard}>
            <Statistic
              title="总用户数"
              value={stats?.totalUsers || 0}
              prefix={<UserOutlined className={styles.statIcon} />}
              valueStyle={{ color: '#722ed1' }}
            />
            <div className={styles.statExtra}>
              本期新增: {stats?.thisMonth?.users || 0}
            </div>
          </Card>
        </Col>
      </Row>

      {/* 趋势图表 */}
      <Row gutter={[16, 16]} className={styles.chartsRow}>
        <Col xs={24} lg={12}>
          <Card 
            title="订单趋势" 
            className={styles.chartCard}
            extra={<TrendingUpOutlined />}
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="#1890ff"
                  strokeWidth={2}
                  dot={{ fill: '#1890ff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card 
            title="收入趋势" 
            className={styles.chartCard}
            extra={<DollarOutlined />}
          >
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#52c41a"
                  fill="#52c41a"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard