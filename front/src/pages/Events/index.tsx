import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Image,
  Dropdown,
  Modal,
  message,
  Input,
  Select,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  SearchOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { MenuProps } from 'antd'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { useAuth } from '@/contexts/AuthContext'
import { getEvents, updateEventStatus, deleteEvent } from '@/services/events'
import type { Event } from '@/types'
import styles from './index.module.css'

const { Search } = Input
const { Option } = Select

const Events: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  })
  
  const navigate = useNavigate()
  const { admin } = useAuth()

  const fetchEvents = async () => {
    if (!admin?.tenantId) return
    
    try {
      setLoading(true)
      const response = await getEvents({
        tenantId: admin.tenantId,
        page: pagination.current,
        pageSize: pagination.pageSize,
        status: filters.status || undefined,
      })
      
      if (response.data) {
        setEvents(response.data.items)
        setPagination(prev => ({
          ...prev,
          total: response.data.total,
        }))
      }
    } catch (error) {
      console.error('Failed to fetch events:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [admin?.tenantId, pagination.current, pagination.pageSize, filters])

  const handleStatusChange = async (eventId: string, status: string) => {
    try {
      await updateEventStatus(eventId, status)
      message.success('状态更新成功')
      fetchEvents()
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handleDelete = (eventId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个演出吗？此操作不可恢复。',
      okText: '确认',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteEvent(eventId)
          message.success('删除成功')
          fetchEvents()
        } catch (error) {
          console.error('Failed to delete event:', error)
        }
      },
    })
  }

  const getStatusTag = (status: string) => {
    const statusMap = {
      upcoming: { color: 'blue', text: '即将开始' },
      onSale: { color: 'green', text: '正在售票' },
      soldOut: { color: 'red', text: '已售罄' },
      cancelled: { color: 'default', text: '已取消' },
    }
    
    const config = statusMap[status as keyof typeof statusMap] || { color: 'default', text: status }
    return <Tag color={config.color}>{config.text}</Tag>
  }

  const getActionMenu = (event: Event): MenuProps['items'] => [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: '查看详情',
      onClick: () => navigate(`/events/${event.id}`),
    },
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: '编辑演出',
      onClick: () => navigate(`/events/${event.id}/edit`),
    },
    {
      type: 'divider',
    },
    {
      key: 'onSale',
      label: '开始售票',
      disabled: event.status === 'onSale',
      onClick: () => handleStatusChange(event.id, 'onSale'),
    },
    {
      key: 'soldOut',
      label: '标记售罄',
      disabled: event.status === 'soldOut',
      onClick: () => handleStatusChange(event.id, 'soldOut'),
    },
    {
      key: 'cancelled',
      label: '取消演出',
      disabled: event.status === 'cancelled',
      onClick: () => handleStatusChange(event.id, 'cancelled'),
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: '删除演出',
      danger: true,
      onClick: () => handleDelete(event.id),
    },
  ]

  const columns: ColumnsType<Event> = [
    {
      title: '海报',
      dataIndex: 'poster',
      width: 80,
      render: (poster: string) => (
        <Image
          src={poster || '/placeholder-poster.png'}
          alt="演出海报"
          width={60}
          height={80}
          style={{ objectFit: 'cover', borderRadius: 4 }}
        />
      ),
    },
    {
      title: '演出信息',
      key: 'info',
      render: (_, event) => (
        <div>
          <div className={styles.eventTitle}>{event.title}</div>
          <div className={styles.eventMeta}>
            <span>📍 {event.venue}</span>
            <span>🎭 {event.performers.join('、')}</span>
          </div>
        </div>
      ),
    },
    {
      title: '演出时间',
      key: 'datetime',
      width: 150,
      render: (_, event) => (
        <div>
          <div>{dayjs(event.eventDate).format('YYYY-MM-DD')}</div>
          <div className={styles.eventTime}>{event.eventTime}</div>
        </div>
      ),
    },
    {
      title: '票务信息',
      key: 'tickets',
      width: 120,
      render: (_, event) => (
        <div>
          <div>总座位: {event.totalSeats}</div>
          <div>余票: {event.remainingSeats}</div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      render: (_, event) => (
        <Dropdown
          menu={{ items: getActionMenu(event) }}
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
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
    <div className={styles.events}>
      <Card>
        <div className={styles.header}>
          <div className={styles.title}>演出管理</div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/events/new')}
          >
            新建演出
          </Button>
        </div>

        <div className={styles.filters}>
          <Space>
            <Search
              placeholder="搜索演出标题"
              style={{ width: 200 }}
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
              <Option value="upcoming">即将开始</Option>
              <Option value="onSale">正在售票</Option>
              <Option value="soldOut">已售罄</Option>
              <Option value="cancelled">已取消</Option>
            </Select>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={events}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
          onChange={handleTableChange}
        />
      </Card>
    </div>
  )
}

export default Events