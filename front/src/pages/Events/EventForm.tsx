import React, { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Input,
  Button,
  DatePicker,
  TimePicker,
  InputNumber,
  Select,
  Space,
  Divider,
  message,
  Row,
  Col,
} from 'antd'
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { useAuth } from '@/contexts/AuthContext'
import { createEvent, updateEvent, getEvent } from '@/services/events'
import type { EventForm, Event } from '@/types'
import styles from './EventForm.module.css'

const { TextArea } = Input
const { Option } = Select

const EventFormPage: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(false)
  const [event, setEvent] = useState<Event | null>(null)
  
  const navigate = useNavigate()
  const { id } = useParams()
  const { admin } = useAuth()
  const isEditing = !!id

  useEffect(() => {
    if (isEditing && id) {
      fetchEvent(id)
    }
  }, [isEditing, id])

  const fetchEvent = async (eventId: string) => {
    try {
      setInitialLoading(true)
      const response = await getEvent(eventId)
      if (response.data) {
        setEvent(response.data)
        // 填充表单
        form.setFieldsValue({
          ...response.data,
          eventDate: dayjs(response.data.eventDate),
          eventTime: dayjs(`1970-01-01T${response.data.eventTime}:00`),
          priceOptions: response.data.priceOptions.map(option => ({
            ...option,
            sortOrder: option.sortOrder || 0,
          })),
        })
      }
    } catch (error) {
      console.error('Failed to fetch event:', error)
      navigate('/events')
    } finally {
      setInitialLoading(false)
    }
  }

  const handleSubmit = async (values: any) => {
    if (!admin?.tenantId) return

    try {
      setLoading(true)
      
      const formData: EventForm & { tenantId: string } = {
        ...values,
        tenantId: admin.tenantId,
        eventDate: values.eventDate.format('YYYY-MM-DD'),
        eventTime: values.eventTime.format('HH:mm'),
        performers: values.performers || [],
        tags: values.tags || [],
        priceOptions: values.priceOptions.map((option: any, index: number) => ({
          ...option,
          sortOrder: option.sortOrder ?? index,
        })),
      }

      if (isEditing && id) {
        await updateEvent(id, formData)
        message.success('演出更新成功')
      } else {
        await createEvent(formData)
        message.success('演出创建成功')
      }
      
      navigate('/events')
    } catch (error) {
      console.error('Failed to save event:', error)
    } finally {
      setLoading(false)
    }
  }

  const cities = [
    '北京', '上海', '广州', '深圳', '杭州', '南京', '武汉', '成都', '西安', '重庆'
  ]

  if (initialLoading) {
    return (
      <div className={styles.loading}>
        加载中...
      </div>
    )
  }

  return (
    <div className={styles.eventForm}>
      <Card>
        <div className={styles.header}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/events')}
          >
            返回演出列表
          </Button>
          <div className={styles.title}>
            {isEditing ? '编辑演出' : '新建演出'}
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            duration: 90,
            performers: [],
            tags: [],
            priceOptions: [
              {
                name: 'VIP座位',
                price: 168,
                totalCount: 20,
                sortOrder: 0,
              },
              {
                name: '普通座位',
                price: 98,
                totalCount: 60,
                sortOrder: 1,
              },
            ],
          }}
        >
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item
                name="title"
                label="演出标题"
                rules={[{ required: true, message: '请输入演出标题' }]}
              >
                <Input placeholder="请输入演出标题" />
              </Form.Item>
            </Col>
            
            <Col xs={24} md={12}>
              <Form.Item
                name="city"
                label="演出城市"
                rules={[{ required: true, message: '请选择演出城市' }]}
              >
                <Select placeholder="请选择演出城市">
                  {cities.map(city => (
                    <Option key={city} value={city}>{city}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="演出描述"
          >
            <TextArea rows={4} placeholder="请输入演出描述" />
          </Form.Item>

          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item
                name="venue"
                label="演出场馆"
                rules={[{ required: true, message: '请输入演出场馆' }]}
              >
                <Input placeholder="请输入演出场馆" />
              </Form.Item>
            </Col>
            
            <Col xs={24} md={12}>
              <Form.Item
                name="address"
                label="详细地址"
                rules={[{ required: true, message: '请输入详细地址' }]}
              >
                <Input placeholder="请输入详细地址" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item
                name="eventDate"
                label="演出日期"
                rules={[{ required: true, message: '请选择演出日期' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  placeholder="请选择演出日期"
                />
              </Form.Item>
            </Col>
            
            <Col xs={24} md={8}>
              <Form.Item
                name="eventTime"
                label="演出时间"
                rules={[{ required: true, message: '请选择演出时间' }]}
              >
                <TimePicker
                  style={{ width: '100%' }}
                  format="HH:mm"
                  placeholder="请选择演出时间"
                />
              </Form.Item>
            </Col>
            
            <Col xs={24} md={8}>
              <Form.Item
                name="duration"
                label="演出时长(分钟)"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={30}
                  max={300}
                  placeholder="演出时长"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="performers"
            label="演出嘉宾"
            rules={[{ required: true, message: '请输入至少一位演出嘉宾' }]}
          >
            <Select
              mode="tags"
              placeholder="请输入演出嘉宾，回车添加"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="tags"
            label="演出标签"
          >
            <Select
              mode="tags"
              placeholder="请输入演出标签，回车添加"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="poster"
            label="演出海报"
          >
            <Input placeholder="请输入海报图片URL" />
          </Form.Item>

          <Divider>票价设置</Divider>

          <Form.List name="priceOptions">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Card
                    key={key}
                    size="small"
                    title={`票价选项 ${name + 1}`}
                    className={styles.priceCard}
                    extra={
                      fields.length > 1 && (
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(name)}
                        >
                          删除
                        </Button>
                      )
                    }
                  >
                    <Row gutter={16}>
                      <Col xs={24} sm={12} md={6}>
                        <Form.Item
                          {...restField}
                          name={[name, 'name']}
                          label="票种名称"
                          rules={[{ required: true, message: '请输入票种名称' }]}
                        >
                          <Input placeholder="如：VIP座位" />
                        </Form.Item>
                      </Col>
                      
                      <Col xs={24} sm={12} md={6}>
                        <Form.Item
                          {...restField}
                          name={[name, 'price']}
                          label="售价(元)"
                          rules={[{ required: true, message: '请输入售价' }]}
                        >
                          <InputNumber
                            style={{ width: '100%' }}
                            min={0}
                            step={0.01}
                            placeholder="售价"
                          />
                        </Form.Item>
                      </Col>
                      
                      <Col xs={24} sm={12} md={6}>
                        <Form.Item
                          {...restField}
                          name={[name, 'originalPrice']}
                          label="原价(元)"
                        >
                          <InputNumber
                            style={{ width: '100%' }}
                            min={0}
                            step={0.01}
                            placeholder="原价"
                          />
                        </Form.Item>
                      </Col>
                      
                      <Col xs={24} sm={12} md={6}>
                        <Form.Item
                          {...restField}
                          name={[name, 'totalCount']}
                          label="总数量"
                          rules={[{ required: true, message: '请输入总数量' }]}
                        >
                          <InputNumber
                            style={{ width: '100%' }}
                            min={1}
                            placeholder="总数量"
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    
                    <Form.Item
                      {...restField}
                      name={[name, 'description']}
                      label="票种描述"
                    >
                      <TextArea rows={2} placeholder="票种描述" />
                    </Form.Item>
                  </Card>
                ))}
                
                <Button
                  type="dashed"
                  onClick={() => add({ sortOrder: fields.length })}
                  icon={<PlusOutlined />}
                  style={{ width: '100%', marginTop: 16 }}
                >
                  添加票价选项
                </Button>
              </>
            )}
          </Form.List>

          <div className={styles.footer}>
            <Space>
              <Button onClick={() => navigate('/events')}>
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<SaveOutlined />}
              >
                {isEditing ? '更新演出' : '创建演出'}
              </Button>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default EventFormPage