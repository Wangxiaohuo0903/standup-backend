// 通用响应类型
export interface ApiResponse<T = any> {
  code: number
  message: string
  data?: T
  timestamp: number
}

export interface PaginatedResponse<T> {
  code: number
  message: string
  data: {
    items: T[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
  timestamp: number
}

// 用户相关类型
export interface User {
  id: string
  openid: string
  nickname?: string
  avatar?: string
  phone?: string
  realName?: string
  status: 'active' | 'disabled'
  createdAt: string
  updatedAt: string
}

// 租户相关类型
export interface Tenant {
  id: string
  name: string
  logo?: string
  themeConfig?: {
    primary: string
    accent: string
    bg: string
    text: string
    muted: string
  }
  featuresConfig?: {
    enableCalendar: boolean
    enableMembership: boolean
    enableCoupon: boolean
  }
  contactInfo?: {
    phone?: string
    address?: string
    email?: string
  }
  status: 'active' | 'disabled'
  createdAt: string
  updatedAt: string
}

// 演出相关类型
export interface Event {
  id: string
  tenantId: string
  title: string
  description?: string
  poster?: string
  city: string
  venue: string
  address: string
  eventDate: string
  eventTime: string
  duration: number
  totalSeats: number
  remainingSeats: number
  performers: string[]
  tags: string[]
  status: 'upcoming' | 'onSale' | 'soldOut' | 'cancelled'
  priceOptions: PriceOption[]
  createdAt: string
  updatedAt: string
}

export interface PriceOption {
  id: string
  eventId: string
  name: string
  price: number
  originalPrice?: number
  description?: string
  totalCount: number
  remainingCount: number
  sortOrder: number
  status: 'active' | 'disabled'
}

// 订单相关类型
export interface Order {
  id: string
  tenantId: string
  userId: string
  eventId: string
  priceOptionId: string
  quantity: number
  totalAmount: number
  userName: string
  userPhone: string
  status: 'pending' | 'paid' | 'cancelled' | 'refunded' | 'used'
  payMethod?: string
  transactionId?: string
  paidAt?: string
  cancelledAt?: string
  refundedAt?: string
  event?: Event
  priceOption?: PriceOption
  user?: User
  tickets?: Ticket[]
  createdAt: string
  updatedAt: string
}

export interface Ticket {
  id: string
  orderId: string
  seatNo?: string
  qrCode: string
  status: 'valid' | 'used' | 'expired'
  usedAt?: string
  createdAt: string
}

// 管理员相关类型
export interface Admin {
  id: string
  username: string
  tenantId: string
  role: string
}

export interface AdminLoginForm {
  username: string
  password: string
  tenantId: string
}

// 统计数据类型
export interface StatsData {
  totalEvents: number
  totalOrders: number
  totalRevenue: number
  totalUsers: number
  thisMonth: {
    events: number
    orders: number
    revenue: number
    users: number
  }
}

// 表单类型
export interface EventForm {
  title: string
  description?: string
  poster?: string
  city: string
  venue: string
  address: string
  eventDate: string
  eventTime: string
  duration?: number
  performers: string[]
  tags?: string[]
  priceOptions: PriceOptionForm[]
}

export interface PriceOptionForm {
  name: string
  price: number
  originalPrice?: number
  description?: string
  totalCount: number
  sortOrder?: number
}