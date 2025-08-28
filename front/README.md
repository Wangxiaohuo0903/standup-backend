# 脱口秀票务管理后台前端

一个现代化的React管理后台应用，为不同俱乐部提供演出管理、订单管理和数据统计功能。

## 🎯 主要功能

### 🔐 认证系统
- 多租户登录支持
- JWT令牌管理
- 自动登录状态恢复
- 路由权限守卫

### 📊 数据统计仪表板
- 实时数据概览
- 多维度统计图表
- 时间周期筛选
- 趋势分析展示

### 🎭 演出管理
- 演出列表与搜索
- 新建/编辑演出
- 多票价选项设置
- 演出状态管理
- 票务库存控制

### 📋 订单管理
- 订单列表查看
- 订单详情展示
- 退款处理功能
- 状态筛选与搜索

## 🛠 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **UI组件库**: Ant Design 5.x
- **路由**: React Router 6
- **状态管理**: Context API + useState/useEffect
- **网络请求**: Axios
- **图表库**: Recharts
- **日期处理**: Day.js
- **样式**: CSS Modules + Less
- **工具库**: ahooks

## 📦 项目结构

```
front/
├── public/                 # 静态资源
├── src/
│   ├── components/         # 公共组件
│   │   ├── Layout/        # 主布局组件
│   │   └── ProtectedRoute/# 路由守卫
│   ├── contexts/          # Context上下文
│   │   └── AuthContext.tsx # 认证上下文
│   ├── pages/             # 页面组件
│   │   ├── Dashboard/     # 数据统计仪表板
│   │   ├── Events/        # 演出管理
│   │   ├── Orders/        # 订单管理
│   │   └── Login/         # 登录页面
│   ├── services/          # API服务层
│   │   ├── auth.ts        # 认证接口
│   │   ├── events.ts      # 演出接口
│   │   ├── orders.ts      # 订单接口
│   │   └── stats.ts       # 统计接口
│   ├── types/             # TypeScript类型定义
│   ├── utils/             # 工具函数
│   │   └── request.ts     # Axios封装
│   ├── App.tsx           # 主应用组件
│   └── main.tsx          # 入口文件
├── package.json
├── vite.config.ts
└── README.md
```

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- pnpm >= 8.0.0

### 安装依赖
```bash
cd front
pnpm install
```

### 开发环境启动
```bash
pnpm dev
```

访问 http://localhost:3001

### 生产构建
```bash
pnpm build
```

### 预览生产构建
```bash
pnpm preview
```

## 🔧 环境配置

在根目录创建 `.env` 文件：

```env
# API接口地址
VITE_API_BASE_URL=http://localhost:3000/api
```

## 📱 响应式设计

- **桌面端**: 完整功能体验，侧边栏导航
- **平板端**: 优化布局，保持核心功能
- **移动端**: 简化界面，触摸友好

## 🎨 设计特色

### 视觉设计
- 现代化Material Design风格
- 深色主题支持（侧边栏）
- 渐变背景和阴影效果
- 流畅的动画过渡

### 用户体验
- 智能加载状态
- 友好的错误提示
- 快捷键支持
- 无感刷新

## 🔐 登录测试

### 测试账号
```
用户名: admin
密码: admin123
俱乐部: dt (脱口秀俱乐部) 或 xclub (X俱乐部)
```

## 📋 页面功能详解

### 1. 登录页面 (`/login`)
- 俱乐部选择
- 用户名密码登录
- 记住登录状态
- 自动跳转回访问页面

### 2. 数据概览 (`/dashboard`)
- 总演出数、订单数、收入、用户数统计
- 本期新增数据对比
- 订单趋势图表
- 收入趋势图表
- 时间周期筛选

### 3. 演出管理 (`/events`)
#### 演出列表
- 演出海报展示
- 演出信息概览
- 票务信息统计
- 状态标签显示
- 搜索和筛选
- 分页展示

#### 演出表单 (`/events/new`, `/events/:id/edit`)
- 基础信息填写
- 时间地点设置
- 演员标签管理
- 多票价选项配置
- 表单验证
- 自动保存

#### 演出操作
- 开始售票
- 标记售罄
- 取消演出
- 删除演出

### 4. 订单管理 (`/orders`)
#### 订单列表
- 订单基础信息
- 演出和票价信息
- 用户联系信息
- 支付状态展示
- 创建时间显示

#### 订单详情
- 完整订单信息
- 票券详细信息
- 支付时间记录
- 退款时间记录

#### 订单操作
- 查看详情
- 处理退款
- 状态筛选

## 🌟 核心特性

### 多租户支持
- 数据完全隔离
- 独立的品牌展示
- 个性化配置

### 实时数据
- 自动数据刷新
- 乐观更新策略
- 错误重试机制

### 安全性
- JWT令牌认证
- 请求拦截器
- 自动登出机制
- XSS防护

### 性能优化
- 组件懒加载
- 图片懒加载
- 虚拟滚动（可扩展）
- CDN资源优化

## 🧪 开发调试

### 开发者工具
- React Developer Tools
- Redux DevTools (如需要)
- 网络面板调试

### 常见问题
1. **登录失败**: 检查后端API是否正常运行
2. **数据不显示**: 确认租户ID配置正确
3. **样式异常**: 清除浏览器缓存

## 🚀 部署建议

### 生产部署
1. 环境变量配置
2. 构建优化
3. CDN配置
4. 域名绑定

### Docker部署
```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 📈 性能指标

- **首屏加载**: < 2秒
- **页面切换**: < 300ms
- **API响应**: < 1秒
- **内存占用**: < 50MB

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交变更
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情