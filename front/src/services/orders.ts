import { get, put } from '@/utils/request'
import type { Order, PaginatedResponse } from '@/types'

// 获取订单列表
export const getOrders = (params: {
  tenantId: string
  page?: number
  pageSize?: number
  status?: string
}) => {
  return get<Order[]>('/admin/orders', params) as Promise<PaginatedResponse<Order>>
}

// 获取订单详情
export const getOrder = (id: string) => {
  return get<Order>(`/orders/${id}`)
}

// 处理退款
export const processRefund = (orderId: string, tenantId: string) => {
  return put<Order>(`/admin/orders/${orderId}/refund?tenantId=${tenantId}`)
}