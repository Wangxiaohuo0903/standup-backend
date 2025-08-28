import axios from 'axios'
import { message } from 'antd'
import type { ApiResponse } from '@/types'

// 创建axios实例
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 添加token
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const { data } = response
    
    // 如果是下载文件等特殊情况，直接返回
    if (response.config.responseType === 'blob') {
      return response
    }
    
    // 业务成功
    if (data.code === 200) {
      return data
    }
    
    // 业务失败
    message.error(data.message || '请求失败')
    return Promise.reject(new Error(data.message || '请求失败'))
  },
  (error) => {
    console.error('Request Error:', error)
    
    // 处理不同的错误状态码
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          message.error('登录已过期，请重新登录')
          localStorage.removeItem('admin_token')
          localStorage.removeItem('admin_info')
          window.location.href = '/login'
          break
        case 403:
          message.error('没有权限访问该资源')
          break
        case 404:
          message.error('请求的资源不存在')
          break
        case 500:
          message.error('服务器内部错误')
          break
        default:
          message.error(data?.message || `请求失败(${status})`)
      }
    } else if (error.code === 'ECONNABORTED') {
      message.error('请求超时，请检查网络连接')
    } else {
      message.error('网络错误，请检查网络连接')
    }
    
    return Promise.reject(error)
  }
)

export default request

// 封装常用的请求方法
export const get = <T = any>(url: string, params?: any): Promise<ApiResponse<T>> => {
  return request.get(url, { params })
}

export const post = <T = any>(url: string, data?: any): Promise<ApiResponse<T>> => {
  return request.post(url, data)
}

export const put = <T = any>(url: string, data?: any): Promise<ApiResponse<T>> => {
  return request.put(url, data)
}

export const del = <T = any>(url: string): Promise<ApiResponse<T>> => {
  return request.delete(url)
}

export const patch = <T = any>(url: string, data?: any): Promise<ApiResponse<T>> => {
  return request.patch(url, data)
}