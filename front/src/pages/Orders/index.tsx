import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Modal,
  message,
  Input,
  Select,
  Tooltip,
  Descriptions,
  Badge,
} from 'antd'
import {
  SearchOutlined,
  EyeOutlined,
  UndoOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useAuth } from '@/contexts/AuthContext'
import { getOrders, getOrder, processRefund } from '@/services/orders'
import type { Order } from '@/types'
import styles from './index.module.css'

const { Search } = Input
const { Option } = Select

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [refundLoading, setRefundLoading] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  })
  
  const { admin } = useAuth()

  const fetchOrders = async () => {
    if (!admin?.tenantId) return
    
    try {
      setLoading(true)
      const response = await getOrders({
        tenantId: admin.tenantId,
        page: pagination.current,
        pageSize: pagination.pageSize,
        status: filters.status || undefined,
      })
      
      if (response.data) {
        setOrders(response.data.items)
        setPagination(prev => ({
          ...prev,
          total: response.data.total,
        }))
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [admin?.tenantId, pagination.current, pagination.pageSize, filters])

  const handleViewDetail = async (orderId: string) => {
    try {
      const response = await getOrder(orderId)
      if (response.data) {
        setSelectedOrder(response.data)
        setDetailModalOpen(true)
      }
    } catch (error) {
      console.error('Failed to fetch order detail:', error)
    }
  }

  const handleRefund = async (orderId: string) => {
    if (!admin?.tenantId) return
    
    Modal.confirm({
      title: '确认退款',
      content: '确定要处理这个订单的退款吗？此操作将直接退款到用户原支付方式。',
      okText: '确认退款',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          setRefundLoading(true)
          await processRefund(orderId, admin.tenantId)
          message.success('退款处理成功')
          fetchOrders()
          setDetailModalOpen(false)
        } catch (error) {
          console.error('Failed to process refund:', error)
        } finally {
          setRefundLoading(false)
        }
      },
    })
  }

  const getStatusTag = (status: string) => {
    const statusMap = {
      pending: { color: 'processing', text: '待支付' },
      paid: { color: 'success', text: '已支付' },
      cancelled: { color: 'default', text: '已取消' },
      refunded: { color: 'warning', text: '已退款' },
      used: { color: 'purple', text: '已使用' },
    }
    
    const config = statusMap[status as keyof typeof statusMap] || { color: 'default', text: status }
    return <Tag color={config.color}>{config.text}</Tag>
  }

  const getPayMethodText = (method?: string) => {
    const methodMap = {
      wechat: '微信支付',
      alipay: '支付宝',
    }
    return method ? methodMap[method as keyof typeof methodMap] || method : '-'
  }

  const columns: ColumnsType<Order> = [
    {
      title: '订单号',
      dataIndex: 'id',
      width: 120,
      render: (id: string) => (
        <Tooltip title={id}>
          <span className={styles.orderId}>{id.slice(-8).toUpperCase()}</span>
        </Tooltip>
      ),
    },
    {
      title: '演出信息',
      key: 'event',
      render: (_, order) => (
        <div className={styles.eventInfo}>
          <div className={styles.eventTitle}>{order.event?.title || '-'}</div>
          <div className={styles.eventMeta}>
            {dayjs(order.event?.eventDate).format('MM-DD')} {order.event?.eventTime}
          </div>
        </div>
      ),
    },
    {
      title: '购买信息',
      key: 'purchase',
      render: (_, order) => (
        <div>
          <div>{order.priceOption?.name || '-'}</div>
          <div className={styles.quantity}>数量: {order.quantity}</div>
        </div>
      ),
    },
    {
      title: '用户信息',
      key: 'user',
      render: (_, order) => (
        <div>
          <div>{order.userName}</div>
          <div className={styles.phone}>{order.userPhone}</div>
        </div>
      ),
    },
    {
      title: '金额',
      dataIndex: 'totalAmount',
      width: 100,
      render: (amount: number) => (
        <span className={styles.amount}>¥{amount.toFixed(2)}</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 120,
      render: (time: string) => (
        <div>
          <div>{dayjs(time).format('MM-DD')}</div>
          <div className={styles.time}>{dayjs(time).format('HH:mm')}</div>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, order) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(order.id)}
          >
            详情
          </Button>
          {order.status === 'paid' && (
            <Button
              type="link"
              size="small"
              danger
              icon={<UndoOutlined />}
              onClick={() => handleRefund(order.id)}
            >
              退款
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const handleTableChange = (newPagination: any) => {
    setPagination(prev => ({
      ...prev,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    }))
  }

  return (
    <div className={styles.orders}>
      <Card>
        <div className={styles.header}>
          <div className={styles.title}>订单管理</div>
        </div>

        <div className={styles.filters}>
          <Space>
            <Search
              placeholder="搜索订单号/用户姓名/手机号"
              style={{ width: 250 }}
              onSearch={(value) => setFilters(prev => ({ ...prev, search: value }))}
              allowClear
            />
            <Select
              placeholder="状态筛选"
              style={{ width: 120 }}
              value={filters.status || undefined}
              onChange={(value) => setFilters(prev => ({ ...prev, status: value || '' }))}
              allowClear
            >
              <Option value="pending">待支付</Option>
              <Option value="paid">已支付</Option>
              <Option value="cancelled">已取消</Option>
              <Option value="refunded">已退款</Option>
              <Option value="used">已使用</Option>
            </Select>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* 订单详情弹窗 */}
      <Modal
        title="订单详情"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setDetailModalOpen(false)}>
            关闭
          </Button>,
          selectedOrder?.status === 'paid' && (
            <Button
              key="refund"
              danger
              loading={refundLoading}
              icon={<UndoOutlined />}
              onClick={() => selectedOrder && handleRefund(selectedOrder.id)}
            >
              处理退款
            </Button>
          ),
        ].filter(Boolean)}
      >
        {selectedOrder && (
          <div className={styles.orderDetail}>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="订单号" span={2}>
                {selectedOrder.id}
              </Descriptions.Item>
              
              <Descriptions.Item label="订单状态">
                {getStatusTag(selectedOrder.status)}
              </Descriptions.Item>
              
              <Descriptions.Item label="支付方式">
                {getPayMethodText(selectedOrder.payMethod)}
              </Descriptions.Item>

              <Descriptions.Item label="演出名称" span={2}>
                {selectedOrder.event?.title || '-'}
              </Descriptions.Item>

              <Descriptions.Item label="演出时间">
                {dayjs(selectedOrder.event?.eventDate).format('YYYY-MM-DD')}
              </Descriptions.Item>
              
              <Descriptions.Item label="演出地点">
                {selectedOrder.event?.venue || '-'}
              </Descriptions.Item>

              <Descriptions.Item label="票种">
                {selectedOrder.priceOption?.name || '-'}
              </Descriptions.Item>
              
              <Descriptions.Item label="购买数量">
                {selectedOrder.quantity} 张
              </Descriptions.Item>

              <Descriptions.Item label="单价">
                ¥{selectedOrder.priceOption?.price || 0}
              </Descriptions.Item>
              
              <Descriptions.Item label="总金额">
                <span className={styles.amount}>¥{selectedOrder.totalAmount}</span>
              </Descriptions.Item>

              <Descriptions.Item label="联系人">
                {selectedOrder.userName}
              </Descriptions.Item>
              
              <Descriptions.Item label="联系电话">
                {selectedOrder.userPhone}
              </Descriptions.Item>

              <Descriptions.Item label="下单时间" span={2}>
                {dayjs(selectedOrder.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>

              {selectedOrder.paidAt && (
                <Descriptions.Item label="支付时间" span={2}>
                  {dayjs(selectedOrder.paidAt).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
              )}

              {selectedOrder.refundedAt && (
                <Descriptions.Item label="退款时间" span={2}>
                  {dayjs(selectedOrder.refundedAt).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
              )}
            </Descriptions>

            {selectedOrder.tickets && selectedOrder.tickets.length > 0 && (
              <div className={styles.ticketsSection}>
                <h4>票券信息</h4>
                <div className={styles.tickets}>
                  {selectedOrder.tickets.map((ticket) => (
                    <div key={ticket.id} className={styles.ticket}>
                      <div className={styles.ticketInfo}>
                        <span>座位号: {ticket.seatNo || '-'}</span>
                        <Badge
                          status={ticket.status === 'valid' ? 'success' : 'default'}
                          text={ticket.status === 'valid' ? '有效' : '已使用'}
                        />
                      </div>
                      <div className={styles.ticketCode}>
                        二维码: {ticket.qrCode.slice(-8).toUpperCase()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Orders