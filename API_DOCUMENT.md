# 脱口秀票务系统 - 后端开发文档

## 项目概述

本系统是一个多租户的脱口秀票务平台，支持不同俱乐部独立运营。系统包含微信小程序前端和Web管理后台，提供完整的票务销售和管理功能。

## 技术栈建议

- **后端框架**: Node.js + Express/Koa + TypeScript
- **数据库**: MySQL 8.0+ (主数据库) + Redis (缓存)
- **ORM**: TypeORM 或 Prisma
- **支付**: 微信支付API
- **部署**: Docker + PM2

## 数据库设计

### 1. 租户表 (tenants)

```sql
CREATE TABLE `tenants` (
  `id` VARCHAR(50) PRIMARY KEY,           -- 租户ID (dt, xclub等)
  `name` VARCHAR(100) NOT NULL,           -- 租户名称
  `logo` VARCHAR(500),                    -- Logo URL
  `theme_config` JSON,                    -- 主题配置 (颜色、字体等)
  `features_config` JSON,                 -- 功能配置
  `contact_info` JSON,                    -- 联系信息
  `status` ENUM('active', 'disabled') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 2. 用户表 (users)

```sql
CREATE TABLE `users` (
  `id` VARCHAR(50) PRIMARY KEY,
  `openid` VARCHAR(100) UNIQUE NOT NULL,  -- 微信openid
  `unionid` VARCHAR(100),                 -- 微信unionid
  `nickname` VARCHAR(100),                -- 昵称
  `avatar` VARCHAR(500),                  -- 头像URL
  `phone` VARCHAR(20),                    -- 手机号
  `real_name` VARCHAR(50),                -- 真实姓名
  `gender` TINYINT,                       -- 性别 0未知 1男 2女
  `city` VARCHAR(50),                     -- 城市
  `province` VARCHAR(50),                 -- 省份
  `country` VARCHAR(50),                  -- 国家
  `status` ENUM('active', 'disabled') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_openid` (`openid`)
);
```

### 3. 演出表 (events)

```sql
CREATE TABLE `events` (
  `id` VARCHAR(50) PRIMARY KEY,
  `tenant_id` VARCHAR(50) NOT NULL,       -- 租户ID
  `title` VARCHAR(200) NOT NULL,          -- 演出标题
  `description` TEXT,                     -- 演出描述
  `poster` VARCHAR(500),                  -- 海报URL
  `city` VARCHAR(50) NOT NULL,            -- 城市
  `venue` VARCHAR(200) NOT NULL,          -- 场馆名称
  `address` VARCHAR(500) NOT NULL,        -- 详细地址
  `event_date` DATE NOT NULL,             -- 演出日期
  `event_time` TIME NOT NULL,             -- 演出时间
  `duration` INT DEFAULT 90,              -- 演出时长(分钟)
  `total_seats` INT NOT NULL,             -- 总座位数
  `remaining_seats` INT NOT NULL,         -- 剩余座位数
  `performers` JSON,                      -- 演员列表
  `tags` JSON,                           -- 标签列表
  `status` ENUM('upcoming', 'onSale', 'soldOut', 'cancelled') DEFAULT 'upcoming',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`),
  INDEX `idx_tenant_date` (`tenant_id`, `event_date`),
  INDEX `idx_status` (`status`)
);
```

### 4. 价格选项表 (price_options)

```sql
CREATE TABLE `price_options` (
  `id` VARCHAR(50) PRIMARY KEY,
  `event_id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,           -- 价格名称 (前排座位、中间座位等)
  `price` DECIMAL(10,2) NOT NULL,         -- 价格
  `original_price` DECIMAL(10,2),         -- 原价
  `description` VARCHAR(500),             -- 价格描述
  `total_count` INT NOT NULL,             -- 总数量
  `remaining_count` INT NOT NULL,         -- 剩余数量
  `sort_order` INT DEFAULT 0,             -- 排序
  `status` ENUM('active', 'disabled') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE,
  INDEX `idx_event_id` (`event_id`)
);
```

### 5. 订单表 (orders)

```sql
CREATE TABLE `orders` (
  `id` VARCHAR(50) PRIMARY KEY,
  `tenant_id` VARCHAR(50) NOT NULL,       -- 租户ID
  `user_id` VARCHAR(50) NOT NULL,         -- 用户ID
  `event_id` VARCHAR(50) NOT NULL,        -- 演出ID
  `price_option_id` VARCHAR(50) NOT NULL, -- 价格选项ID
  `quantity` INT NOT NULL,                -- 购买数量
  `total_amount` DECIMAL(10,2) NOT NULL,  -- 总金额
  `user_name` VARCHAR(100) NOT NULL,      -- 联系人姓名
  `user_phone` VARCHAR(20) NOT NULL,      -- 联系人电话
  `status` ENUM('pending', 'paid', 'cancelled', 'refunded', 'used') DEFAULT 'pending',
  `pay_method` VARCHAR(50),               -- 支付方式
  `transaction_id` VARCHAR(100),          -- 微信支付交易号
  `paid_at` TIMESTAMP NULL,               -- 支付时间
  `cancelled_at` TIMESTAMP NULL,          -- 取消时间
  `refunded_at` TIMESTAMP NULL,           -- 退款时间
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`event_id`) REFERENCES `events`(`id`),
  FOREIGN KEY (`price_option_id`) REFERENCES `price_options`(`id`),
  INDEX `idx_user_tenant` (`user_id`, `tenant_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_at` (`created_at`)
);
```

### 6. 票券表 (tickets)

```sql
CREATE TABLE `tickets` (
  `id` VARCHAR(50) PRIMARY KEY,
  `order_id` VARCHAR(50) NOT NULL,        -- 订单ID
  `seat_no` VARCHAR(20),                  -- 座位号
  `qr_code` VARCHAR(200) UNIQUE NOT NULL, -- 二维码内容
  `status` ENUM('valid', 'used', 'expired') DEFAULT 'valid',
  `used_at` TIMESTAMP NULL,               -- 使用时间
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  INDEX `idx_order_id` (`order_id`),
  INDEX `idx_qr_code` (`qr_code`)
);
```

## TypeScript 数据类型定义

### 基础类型

```typescript
// 租户配置
export interface TenantConfig {
  id: string;
  name: string;
  logo?: string;
  theme: {
    primary: string;
    accent: string;
    bg: string;
    text: string;
    muted: string;
  };
  contact?: {
    phone?: string;
    address?: string;
    email?: string;
  };
  features: {
    enableCalendar: boolean;
    enableMembership: boolean;
    enableCoupon: boolean;
  };
}

// 用户信息
export interface User {
  id: string;
  openid: string;
  unionid?: string;
  nickname?: string;
  avatar?: string;
  phone?: string;
  realName?: string;
  gender?: 0 | 1 | 2;
  city?: string;
  province?: string;
  country?: string;
  status: 'active' | 'disabled';
  createdAt: string;
  updatedAt: string;
}

// 演出信息
export interface Event {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  poster?: string;
  city: string;
  venue: string;
  address: string;
  eventDate: string;   // YYYY-MM-DD
  eventTime: string;   // HH:mm
  duration: number;    // 分钟
  totalSeats: number;
  remainingSeats: number;
  performers: string[];
  tags: string[];
  status: 'upcoming' | 'onSale' | 'soldOut' | 'cancelled';
  priceOptions: PriceOption[];
  createdAt: string;
  updatedAt: string;
}

// 价格选项
export interface PriceOption {
  id: string;
  eventId: string;
  name: string;
  price: number;
  originalPrice?: number;
  description?: string;
  totalCount: number;
  remainingCount: number;
  sortOrder: number;
  status: 'active' | 'disabled';
}

// 订单信息
export interface Order {
  id: string;
  tenantId: string;
  userId: string;
  eventId: string;
  priceOptionId: string;
  quantity: number;
  totalAmount: number;
  userName: string;
  userPhone: string;
  status: 'pending' | 'paid' | 'cancelled' | 'refunded' | 'used';
  payMethod?: string;
  transactionId?: string;
  paidAt?: string;
  cancelledAt?: string;
  refundedAt?: string;
  tickets: Ticket[];
  // 关联信息
  event?: Event;
  priceOption?: PriceOption;
  createdAt: string;
  updatedAt: string;
}

// 票券信息
export interface Ticket {
  id: string;
  orderId: string;
  seatNo?: string;
  qrCode: string;
  status: 'valid' | 'used' | 'expired';
  usedAt?: string;
  createdAt: string;
}
```

## API 接口规范

### 通用响应格式

```typescript
interface ApiResponse<T = any> {
  code: number;        // 状态码 200成功 400客户端错误 500服务器错误
  message: string;     // 响应消息
  data?: T;           // 响应数据
  timestamp: number;   // 时间戳
}

interface PaginatedResponse<T> {
  code: number;
  message: string;
  data: {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  timestamp: number;
}
```

### 认证和用户相关

#### 1. 微信登录
```
POST /api/auth/wechat/login
Content-Type: application/json

Request:
{
  "code": "微信登录code",
  "tenantId": "租户ID"
}

Response:
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "JWT_TOKEN",
    "user": User,
    "expiresIn": 7200
  }
}
```

#### 2. 更新用户信息
```
PUT /api/users/profile
Authorization: Bearer {token}

Request:
{
  "nickname": "昵称",
  "avatar": "头像URL",
  "phone": "手机号",
  "realName": "真实姓名"
}
```

### 演出相关接口

#### 1. 获取首页数据
```
GET /api/events/home?tenantId={tenantId}

Response:
{
  "code": 200,
  "data": {
    "banners": Banner[],
    "upcoming": Event[],
    "recommended": Event[],
    "upcomingSale": Event[],
    "merch": MerchItem[]
  }
}
```

#### 2. 获取日历演出数据
```
GET /api/events/calendar/{year}/{month}?tenantId={tenantId}

Response:
{
  "code": 200,
  "data": {
    "2024-12-25": Event[],
    "2024-12-26": Event[]
    // 以日期为key的演出列表
  }
}
```

#### 3. 获取演出详情
```
GET /api/events/{eventId}

Response:
{
  "code": 200,
  "data": Event
}
```

#### 4. 获取演出列表
```
GET /api/events?tenantId={tenantId}&page=1&pageSize=10&status=onSale&date=2024-12-25

Response: PaginatedResponse<Event>
```

### 订单相关接口

#### 1. 创建订单
```
POST /api/orders
Authorization: Bearer {token}

Request:
{
  "eventId": "演出ID",
  "priceOptionId": "价格选项ID",
  "quantity": 2,
  "userInfo": {
    "name": "联系人姓名",
    "phone": "联系人电话"
  }
}

Response:
{
  "code": 200,
  "data": Order
}
```

#### 2. 获取订单详情
```
GET /api/orders/{orderId}
Authorization: Bearer {token}

Response:
{
  "code": 200,
  "data": Order
}
```

#### 3. 获取用户订单列表
```
GET /api/orders?page=1&pageSize=10&status=paid&tenantId={tenantId}
Authorization: Bearer {token}

Response: PaginatedResponse<Order>
```

#### 4. 取消订单
```
PUT /api/orders/{orderId}/cancel
Authorization: Bearer {token}

Response:
{
  "code": 200,
  "message": "订单已取消"
}
```

### 支付相关接口

#### 1. 发起支付
```
POST /api/payments/wechat
Authorization: Bearer {token}

Request:
{
  "orderId": "订单ID"
}

Response:
{
  "code": 200,
  "data": {
    "appId": "小程序appId",
    "timeStamp": "时间戳",
    "nonceStr": "随机字符串",
    "package": "prepay_id=xxx",
    "signType": "RSA",
    "paySign": "签名"
  }
}
```

#### 2. 支付回调
```
POST /api/payments/wechat/notify
Content-Type: application/xml

微信支付结果通知
```

#### 3. 申请退款
```
POST /api/payments/refund
Authorization: Bearer {token}

Request:
{
  "orderId": "订单ID",
  "reason": "退款原因"
}
```

### 管理后台接口

#### 1. 管理员登录
```
POST /api/admin/auth/login

Request:
{
  "username": "管理员账号",
  "password": "密码",
  "tenantId": "租户ID"
}
```

#### 2. 获取统计数据
```
GET /api/admin/stats?tenantId={tenantId}&period=thisMonth
Authorization: Bearer {adminToken}

Response:
{
  "code": 200,
  "data": {
    "totalEvents": 45,
    "totalOrders": 1286,
    "totalRevenue": 128600,
    "totalUsers": 856,
    "thisMonth": {
      "events": 12,
      "orders": 345,
      "revenue": 45600,
      "users": 128
    }
  }
}
```

#### 3. 演出管理 CRUD
```
# 创建演出
POST /api/admin/events

# 更新演出
PUT /api/admin/events/{eventId}

# 删除演出
DELETE /api/admin/events/{eventId}

# 获取演出列表
GET /api/admin/events?tenantId={tenantId}&page=1&pageSize=10
```

#### 4. 订单管理
```
# 获取订单列表
GET /api/admin/orders?tenantId={tenantId}&status=paid&page=1&pageSize=10

# 处理退款
PUT /api/admin/orders/{orderId}/refund
```

## 数据库索引建议

```sql
-- 租户相关查询优化
CREATE INDEX idx_events_tenant_status ON events(tenant_id, status);
CREATE INDEX idx_orders_tenant_status ON orders(tenant_id, status);

-- 时间范围查询优化
CREATE INDEX idx_events_date_status ON events(event_date, status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- 用户订单查询优化
CREATE INDEX idx_orders_user_tenant_created ON orders(user_id, tenant_id, created_at DESC);

-- 支付查询优化
CREATE INDEX idx_orders_transaction_id ON orders(transaction_id);
```

## 缓存策略

### Redis 缓存键设计

```typescript
// 演出缓存
const EVENT_CACHE_KEY = (eventId: string) => `event:${eventId}`;
const EVENT_LIST_CACHE_KEY = (tenantId: string, page: number) => `events:${tenantId}:${page}`;
const CALENDAR_CACHE_KEY = (tenantId: string, year: number, month: number) => 
  `calendar:${tenantId}:${year}:${month}`;

// 订单缓存
const ORDER_CACHE_KEY = (orderId: string) => `order:${orderId}`;
const USER_ORDERS_CACHE_KEY = (userId: string, tenantId: string) => 
  `user_orders:${userId}:${tenantId}`;

// 统计数据缓存
const STATS_CACHE_KEY = (tenantId: string, period: string) => `stats:${tenantId}:${period}`;
```

## 部署和运维

### 环境变量配置

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=standup_tickets
DB_USER=root
DB_PASSWORD=password

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT配置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# 微信配置
WECHAT_APP_ID=your_wechat_app_id
WECHAT_APP_SECRET=your_wechat_app_secret
WECHAT_MCH_ID=your_merchant_id
WECHAT_MCH_KEY=your_merchant_key

# 文件上传配置
UPLOAD_PATH=/uploads
STATIC_URL=https://your-domain.com/static

# 其他配置
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
```

### Docker 部署配置

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

## 安全考虑

1. **数据隔离**: 所有查询都必须包含 tenantId 过滤
2. **权限验证**: JWT token 验证，管理员权限分离
3. **参数校验**: 使用 Joi 或类似工具进行请求参数验证
4. **SQL注入防护**: 使用参数化查询
5. **支付安全**: 微信支付签名验证，异步通知验证
6. **接口限流**: 使用 Redis 实现接口访问频率限制

## 性能优化

1. **数据库连接池**: 配置合理的连接池大小
2. **查询优化**: 合理使用索引，避免 N+1 查询
3. **缓存策略**: 热点数据 Redis 缓存，设置合理过期时间
4. **分页查询**: 大数据量查询使用游标分页
5. **图片优化**: CDN 加速，图片压缩处理

## 测试建议

1. **单元测试**: Jest + SuperTest
2. **集成测试**: 数据库事务回滚测试
3. **性能测试**: Apache Bench 或 Artillery 压力测试
4. **安全测试**: SQL 注入、XSS 防护测试

这份文档为后端开发提供了完整的数据结构和接口规范，确保前后端开发的一致性。