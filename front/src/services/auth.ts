import { post } from '@/utils/request'
import type { AdminLoginForm, Admin } from '@/types'

// 管理员登录
export const adminLogin = (data: AdminLoginForm) => {
  return post<{
    token: string
    admin: Admin
    expiresIn: number
  }>('/admin/auth/login', data)
}

// 退出登录
export const logout = () => {
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_info')
  window.location.href = '/login'
}