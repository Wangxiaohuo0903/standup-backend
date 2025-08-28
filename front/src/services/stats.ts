import { get } from '@/utils/request'
import type { StatsData } from '@/types'

// 获取统计数据
export const getStats = (params: {
  tenantId: string
  period?: 'today' | 'thisWeek' | 'thisMonth' | 'thisYear'
}) => {
  return get<StatsData>('/admin/stats', params)
}