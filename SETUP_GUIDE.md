# 脱口秀票务系统 - 后端部署和测试指南

## 项目概述
这是一个基于 NestJS + Prisma + MySQL 的脱口秀票务系统后端，支持多租户架构，包含微信小程序登录、演出管理、订单管理、支付等功能。

## 环境要求
- Node.js >= 18.0.0
- pnpm >= 8.0.0
- MySQL >= 8.0
- Redis >= 6.0 (可选，用于缓存)

## 1. 项目设置

### 1.1 安装依赖
```bash
pnpm install
```

### 1.2 环境配置
项目根目录已创建 `.env` 文件，请根据实际情况修改配置：

```env
# 数据库配置 - 请修改为您的实际数据库信息
DATABASE_URL="mysql://root:password@localhost:3306/standup_tickets"

# Redis配置 (可选)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT配置 - 请修改为您的密钥
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# 微信小程序配置 - 请替换为实际的AppID和Secret
WECHAT_APP_ID=your_wechat_app_id
WECHAT_APP_SECRET=your_wechat_app_secret
WECHAT_MCH_ID=your_merchant_id
WECHAT_MCH_KEY=your_merchant_key

# 文件上传配置
UPLOAD_PATH=./uploads
STATIC_URL=http://localhost:3000/static

# 应用配置
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
```

### 1.3 数据库设置

#### 创建数据库
```bash
mysql -u root -p
```

在MySQL中执行：
```sql
CREATE DATABASE standup_tickets CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 运行数据库迁移
```bash
# 生成Prisma客户端
pnpm prisma generate

# 创建数据库表结构
pnpm prisma db push

# 或者使用迁移（推荐生产环境）
pnpm prisma migrate dev --name init
```

#### 查看数据库结构
```bash
# 打开Prisma Studio可视化工具
pnpm prisma studio
```
访问 http://localhost:5555 查看数据库内容

## 2. 启动项目

### 2.1 开发模式启动
```bash
pnpm run start:dev
```

### 2.2 生产模式启动
```bash
# 构建项目
pnpm run build

# 启动生产服务
pnpm run start:prod
```

## 3. 测试数据准备

### 3.1 创建测试租户
使用Prisma Studio或直接执行SQL：

```sql
INSERT INTO tenants (id, name, status, theme_config, features_config, contact_info) VALUES 
('dt', '脱口秀俱乐部', 'active', 
 '{"primary": "#FF6B6B", "accent": "#4ECDC4", "bg": "#FFFFFF", "text": "#333333", "muted": "#888888"}',
 '{"enableCalendar": true, "enableMembership": true, "enableCoupon": false}',
 '{"phone": "400-123-4567", "address": "北京市朝阳区xxx", "email": "contact@club.com"}'
);
```

### 3.2 创建测试演出
```sql
INSERT INTO events (
  id, tenant_id, title, description, city, venue, address, 
  event_date, event_time, duration, total_seats, remaining_seats, 
  performers, tags, status
) VALUES (
  'event_001', 'dt', '周末脱口秀专场', 
  '汇聚顶级脱口秀演员的精彩演出', '北京', '三里屯剧场', 
  '北京市朝阳区三里屯路19号', '2024-12-30', '20:00:00', 90, 
  100, 100, '["张三", "李四", "王五"]', '["脱口秀", "喜剧", "周末"]', 
  'onSale'
);
```

### 3.3 创建测试价格选项
```sql
INSERT INTO price_options (
  id, event_id, name, price, original_price, description, 
  total_count, remaining_count, sort_order, status
) VALUES 
('price_001', 'event_001', 'VIP座位', 168.00, 198.00, '前三排最佳视野', 20, 20, 1, 'active'),
('price_002', 'event_001', '普通座位', 98.00, 128.00, '中后排座位', 60, 60, 2, 'active'),
('price_003', 'event_001', '学生票', 68.00, 98.00, '凭学生证购买', 20, 20, 3, 'active');
```

## 4. API 测试

### 4.1 使用 curl 测试

#### 测试健康检查
```bash
curl http://localhost:3000
```

#### 测试获取首页数据
```bash
curl "http://localhost:3000/api/events/home?tenantId=dt"
```

#### 测试获取演出列表
```bash
curl "http://localhost:3000/api/events?tenantId=dt&page=1&pageSize=10"
```

#### 测试获取演出详情
```bash
curl "http://localhost:3000/api/events/event_001"
```

#### 测试日历数据
```bash
curl "http://localhost:3000/api/events/calendar/2024/12?tenantId=dt"
```

### 4.2 使用 Postman 或其他API工具

创建 Postman Collection，包含以下接口：

1. **获取首页数据**
   - GET `http://localhost:3000/api/events/home?tenantId=dt`

2. **获取演出列表**
   - GET `http://localhost:3000/api/events?tenantId=dt&page=1&pageSize=10`

3. **获取演出详情**
   - GET `http://localhost:3000/api/events/event_001`

4. **微信登录测试** (需要有效的微信code)
   ```json
   POST http://localhost:3000/api/auth/wechat/login
   Content-Type: application/json
   
   {
     "code": "微信登录返回的code",
     "tenantId": "dt"
   }
   ```

## 5. 错误排查

### 5.1 常见问题

#### 数据库连接错误
```
Error: P1001: Can't reach database server at `localhost`:`3306`
```
解决方案：
- 确保MySQL服务正在运行
- 检查 `.env` 文件中的数据库连接信息
- 确保数据库用户有足够权限

#### Prisma客户端错误
```
Error: PrismaClient is unable to be run in the browser
```
解决方案：
```bash
pnpm prisma generate
```

#### 端口占用错误
```
Error: listen EADDRINUSE: address already in use :::3000
```
解决方案：
- 修改 `.env` 中的 `PORT` 配置
- 或者关闭占用端口的其他进程

### 5.2 日志查看
开发模式下，所有请求和错误信息都会输出到控制台。

### 5.3 数据库状态检查
```bash
# 查看数据库状态
pnpm prisma db pull

# 重置数据库（谨慎使用）
pnpm prisma migrate reset
```

## 6. 开发调试

### 6.1 开发工具
- **Prisma Studio**: `pnpm prisma studio` - 数据库可视化管理
- **热重载**: 代码修改后自动重启服务
- **TypeScript检查**: `pnpm run build` 检查类型错误

### 6.2 测试
```bash
# 运行单元测试
pnpm run test

# 运行端到端测试
pnpm run test:e2e

# 生成测试覆盖率报告
pnpm run test:cov
```

## 7. 生产部署建议

### 7.1 环境变量
生产环境请确保设置：
- `NODE_ENV=production`
- 强密码的 `JWT_SECRET`
- 正确的数据库连接信息
- 有效的微信小程序配置

### 7.2 数据库优化
```sql
-- 创建推荐的索引
CREATE INDEX idx_events_tenant_status ON events(tenant_id, status);
CREATE INDEX idx_orders_tenant_status ON orders(tenant_id, status);
CREATE INDEX idx_events_date_status ON events(event_date, status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
```

### 7.3 安全配置
- 启用HTTPS
- 配置CORS白名单
- 设置请求频率限制
- 定期备份数据库

## 8. 已完成功能

✅ **核心功能已全部实现：**
- ✅ 数据库模式设计 (Prisma Schema)
- ✅ 用户认证模块 (微信登录 + JWT)
- ✅ 用户管理模块 (用户信息更新)
- ✅ 演出管理模块 (CRUD + 首页 + 日历)
- ✅ 订单管理模块 (创建订单 + 查询 + 取消)
- ✅ 支付模块 (微信支付集成 + 退款)
- ✅ 管理后台模块 (统计 + 演出管理 + 订单管理)
- ✅ 全局验证管道和错误处理
- ✅ CORS 配置
- ✅ 环境配置管理

## 9. 快速启动测试

### 9.1 安装并启动
```bash
# 安装依赖
pnpm install

# 生成 Prisma 客户端
pnpm prisma generate

# 启动开发服务器
pnpm run start:dev
```

### 9.2 核心API测试
服务启动后，可以测试以下核心接口：

```bash
# 1. 测试健康检查
curl http://localhost:3000

# 2. 测试获取首页数据
curl "http://localhost:3000/api/events/home?tenantId=dt"

# 3. 测试获取演出列表  
curl "http://localhost:3000/api/events?tenantId=dt&page=1&pageSize=10"

# 4. 测试管理员登录
curl -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123","tenantId":"dt"}'

# 5. 测试获取统计数据 (需要admin token)
curl "http://localhost:3000/api/admin/stats?tenantId=dt" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## 10. 待扩展功能 (可选)

以下功能可根据实际需求进行扩展：
- 📁 文件上传功能 (演出海报、用户头像)
- 📊 Redis缓存层优化 (热点数据缓存)
- 📄 API文档生成 (Swagger/OpenAPI)
- 🎫 更复杂的座位管理系统
- 🎟️ 优惠券系统
- 📧 邮件/短信通知系统
- 📈 更详细的数据统计和报表
- 🔐 更完善的权限管理系统
- 🎨 租户自定义主题配置界面
- 📱 推送通知功能

## 11. 联系支持

如果遇到问题，请检查：
1. 环境配置是否正确
2. 依赖是否完整安装
3. 数据库是否正常连接
4. 日志中的具体错误信息