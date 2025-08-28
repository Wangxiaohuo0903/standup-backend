import { get, post, put, del } from '@/utils/request'
import type { Event, EventForm, PaginatedResponse } from '@/types'

// 获取演出列表
export const getEvents = (params: {
  tenantId: string
  page?: number
  pageSize?: number
  status?: string
  date?: string
  city?: string
}) => {
  return get<Event[]>('/admin/events', params) as Promise<PaginatedResponse<Event>>
}

// 获取演出详情
export const getEvent = (id: string) => {
  return get<Event>(`/events/${id}`)
}

// 创建演出
export const createEvent = (data: EventForm & { tenantId: string }) => {
  return post<Event>('/admin/events', data)
}

// 更新演出
export const updateEvent = (id: string, data: Partial<EventForm>) => {
  return put<Event>(`/admin/events/${id}`, data)
}

// 删除演出
export const deleteEvent = (id: string) => {
  return del(`/admin/events/${id}`)
}

// 更新演出状态
export const updateEventStatus = (id: string, status: string) => {
  return put<Event>(`/admin/events/${id}`, { status })
}