# 脱口秀票务系统 - 前后端联调指南

## 📋 项目概述

本项目包含两个主要部分：
- **后端 API** (`/` 目录) - NestJS + Prisma + MySQL
- **前端管理后台** (`/front` 目录) - React + TypeScript + Ant Design

## 🚀 完整启动流程

### 1. 环境准备

确保安装以下软件：
- Node.js >= 18.0.0
- pnpm >= 8.0.0  
- MySQL >= 8.0

### 2. 后端启动

```bash
# 在项目根目录
cd standup-backend

# 安装依赖
pnpm install

# 配置环境变量
# 编辑 .env 文件，配置数据库连接等信息

# 生成 Prisma 客户端并推送数据库结构
pnpm prisma generate
pnpm prisma db push

# 启动后端服务
pnpm run start:dev
```

后端将运行在 http://localhost:3000

### 3. 前端启动

```bash
# 打开新的终端窗口
cd standup-backend/front

# 安装依赖
pnpm install

# 启动前端开发服务器
pnpm dev
```

前端将运行在 http://localhost:3001

### 4. 访问管理后台

1. 浏览器打开: http://localhost:3001
2. 使用测试账号登录:
   - 俱乐部: `dt` (脱口秀俱乐部)
   - 用户名: `admin`
   - 密码: `admin123`

## 🎯 功能演示路径

### 登录体验
1. 选择俱乐部 → 输入用户名密码 → 登录成功

### 数据概览
- 查看演出数量、订单统计、收入数据
- 观察趋势图表展示

### 演出管理
1. **查看演出列表** - 演出状态、票务信息一览
2. **新建演出** - 填写演出信息、设置多档票价
3. **编辑演出** - 修改演出详情、调整票价
4. **状态管理** - 开始售票、标记售罄、取消演出

### 订单管理  
1. **订单列表** - 查看所有订单、筛选状态
2. **订单详情** - 查看完整订单信息、票券详情
3. **退款处理** - 对已支付订单进行退款操作

## 🔧 开发调试

### API 接口测试
后端提供了详细的 API 文档，可以使用以下方式测试：

```bash
# 测试后端健康检查
curl http://localhost:3000

# 测试管理员登录
curl -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123","tenantId":"dt"}'

# 测试获取演出列表
curl "http://localhost:3000/api/admin/events?tenantId=dt&page=1&pageSize=10"
```

### 前端开发模式
- 支持热重载
- TypeScript 类型检查
- ESLint 代码检查
- 自动代理后端 API

### 数据库管理
```bash
# 打开 Prisma Studio
pnpm prisma studio

# 重置数据库（开发时）
pnpm prisma migrate reset
```

## 📱 响应式设计测试

前端支持多设备访问：
- **桌面端**: 完整功能，侧边栏导航
- **平板端**: 优化布局，保持功能完整性  
- **移动端**: 简化界面，触摸友好

可通过浏览器开发者工具切换设备模式进行测试。

## 🐛 常见问题解决

### 后端启动失败
1. **数据库连接错误**: 检查 `.env` 文件中的数据库配置
2. **端口占用**: 修改 `PORT` 环境变量
3. **依赖问题**: 删除 `node_modules` 重新安装

### 前端启动失败
1. **代理错误**: 确认后端服务正常运行
2. **依赖冲突**: 清除 `node_modules` 重新安装
3. **端口占用**: 修改 `vite.config.ts` 中的端口配置

### 登录失败
1. **后端未启动**: 确认后端服务运行在 3000 端口
2. **账号错误**: 使用正确的测试账号
3. **跨域问题**: 检查后端 CORS 配置

### 数据不显示
1. **租户配置**: 确认选择了正确的俱乐部
2. **权限问题**: 检查 JWT token 是否有效
3. **API 错误**: 查看浏览器控制台和网络面板

## 🚢 生产部署建议

### 后端部署
```bash
# 构建后端
pnpm run build

# 生产模式启动
pnpm run start:prod
```

### 前端部署
```bash
# 构建前端
cd front
pnpm run build

# 使用 nginx 或其他静态服务器部署 dist 目录
```

### Docker 部署
项目已配置 Docker 支持，可参考 `SETUP_GUIDE.md` 中的部署说明。

## 📈 性能优化建议

### 后端优化
- 启用数据库连接池
- 添加 Redis 缓存
- API 响应压缩
- 请求限流

### 前端优化
- 组件懒加载
- 图片优化
- CDN 加速
- 构建优化

## 🎨 自定义配置

### 主题定制
前端支持通过租户配置修改主题色彩，可在数据库 `tenants` 表的 `theme_config` 字段配置。

### 功能开关
通过 `features_config` 字段可以控制不同功能模块的开启关闭。

---

**开发愉快！** 如有问题，请查看项目中的详细文档或提交 Issue。