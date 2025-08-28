# 脱口秀票务系统 - 生产部署和微信对接完整指南

## 📋 目录
1. [微信小程序对接](#微信小程序对接)
2. [云服务器部署](#云服务器部署)  
3. [微信支付接入](#微信支付接入)
4. [域名与SSL配置](#域名与SSL配置)
5. [生产环境优化](#生产环境优化)
6. [监控与运维](#监控与运维)

---

## 1. 微信小程序对接

### 1.1 申请微信小程序

#### 步骤一：注册小程序账号
1. 访问 [微信公众平台](https://mp.weixin.qq.com)
2. 选择"小程序" → "立即注册"
3. 填写账号信息（邮箱、密码）
4. 邮箱激活 → 选择"小程序"
5. 信息登记（个人/企业）
6. 微信认证（企业需要）

#### 步骤二：获取小程序信息
```javascript
// 登录小程序管理后台获取
AppID: wx1234567890abcdef  // 示例
AppSecret: abcdef1234567890abcdef1234567890  // 示例
```

#### 步骤三：配置服务器域名
在小程序后台 → 开发 → 开发管理 → 开发设置 → 服务器域名：
```
request合法域名: https://your-api-domain.com
uploadFile合法域名: https://your-api-domain.com  
downloadFile合法域名: https://your-api-domain.com
```

### 1.2 小程序端代码示例

#### 登录流程
```javascript
// utils/auth.js
export const login = () => {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (res) => {
        if (res.code) {
          // 发送到后端
          wx.request({
            url: 'https://your-api-domain.com/api/auth/wechat/login',
            method: 'POST',
            data: {
              code: res.code,
              tenantId: 'dt' // 根据小程序确定租户
            },
            success: (response) => {
              const { token, user } = response.data.data
              // 存储token
              wx.setStorageSync('token', token)
              wx.setStorageSync('userInfo', user)
              resolve({ token, user })
            },
            fail: reject
          })
        }
      },
      fail: reject
    })
  })
}
```

#### 用户信息授权
```javascript
// 获取用户信息
export const getUserProfile = () => {
  return new Promise((resolve, reject) => {
    wx.getUserProfile({
      desc: '用于完善用户信息',
      success: (res) => {
        const { nickName, avatarUrl, gender, city, province, country } = res.userInfo
        
        // 更新到后端
        wx.request({
          url: 'https://your-api-domain.com/api/users/profile',
          method: 'PUT',
          header: {
            'Authorization': `Bearer ${wx.getStorageSync('token')}`
          },
          data: {
            nickname: nickName,
            avatar: avatarUrl,
            gender,
            city,
            province,
            country
          },
          success: resolve,
          fail: reject
        })
      },
      fail: reject
    })
  })
}
```

#### 获取演出列表
```javascript
// api/events.js
export const getEvents = (params) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: 'https://your-api-domain.com/api/events',
      method: 'GET',
      data: {
        tenantId: 'dt',
        page: params.page || 1,
        pageSize: params.pageSize || 10,
        ...params
      },
      success: resolve,
      fail: reject
    })
  })
}
```

#### 创建订单
```javascript
// api/orders.js
export const createOrder = (orderData) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: 'https://your-api-domain.com/api/orders',
      method: 'POST',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token')}`
      },
      data: orderData,
      success: resolve,
      fail: reject
    })
  })
}
```

#### 微信支付
```javascript
// api/payment.js
export const payOrder = (orderId) => {
  return new Promise((resolve, reject) => {
    // 1. 获取支付参数
    wx.request({
      url: 'https://your-api-domain.com/api/payments/wechat',
      method: 'POST',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token')}`
      },
      data: { orderId },
      success: (res) => {
        const payParams = res.data.data
        
        // 2. 调起微信支付
        wx.requestPayment({
          ...payParams,
          success: (payRes) => {
            wx.showToast({ title: '支付成功', icon: 'success' })
            resolve(payRes)
          },
          fail: (payError) => {
            if (payError.errMsg === 'requestPayment:fail cancel') {
              wx.showToast({ title: '支付已取消', icon: 'none' })
            } else {
              wx.showToast({ title: '支付失败', icon: 'error' })
            }
            reject(payError)
          }
        })
      },
      fail: reject
    })
  })
}
```

---

## 2. 云服务器部署

### 2.1 云服务商选择

#### 推荐方案对比

| 云服务商 | 优势 | 配置推荐 | 月费用 |
|---------|------|----------|--------|
| **阿里云ECS** | 国内访问快、生态完整 | 2核4G | ¥200+ |
| **腾讯云CVM** | 微信生态集成好 | 2核4G | ¥180+ |
| **华为云ECS** | 技术实力强、稳定 | 2核4G | ¥190+ |

#### 推荐配置（生产环境）
```
CPU: 2核心
内存: 4GB
存储: 40GB SSD系统盘 + 100GB数据盘  
带宽: 5Mbps
操作系统: Ubuntu 20.04 LTS
```

### 2.2 服务器基础环境配置

#### 连接服务器
```bash
# 使用SSH连接（替换为您的服务器IP）
ssh root@your-server-ip
```

#### 更新系统
```bash
# 更新软件包
apt update && apt upgrade -y

# 安装基础工具
apt install -y curl wget git vim htop unzip
```

#### 安装Node.js
```bash
# 使用NodeSource安装最新LTS版本
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
apt-get install -y nodejs

# 安装pnpm
npm install -g pnpm

# 验证安装
node --version
pnpm --version
```

#### 安装MySQL
```bash
# 安装MySQL 8.0
apt install -y mysql-server

# 启动MySQL服务
systemctl start mysql
systemctl enable mysql

# 安全配置
mysql_secure_installation

# 创建数据库和用户
mysql -u root -p << EOF
CREATE DATABASE standup_tickets CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'standup_user'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON standup_tickets.* TO 'standup_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
EOF
```

#### 安装Nginx
```bash
# 安装Nginx
apt install -y nginx

# 启动并设置开机自启
systemctl start nginx
systemctl enable nginx

# 检查状态
systemctl status nginx
```

#### 安装PM2（进程管理）
```bash
# 全局安装PM2
npm install -g pm2

# 设置开机自启
pm2 startup
# 按照提示执行返回的命令
```

### 2.3 部署后端应用

#### 上传代码
```bash
# 方法1：使用Git（推荐）
cd /opt
git clone https://github.com/your-username/standup-backend.git
cd standup-backend

# 方法2：使用scp上传
# 本地执行：scp -r ./standup-backend root@your-server-ip:/opt/
```

#### 安装依赖和构建
```bash
cd /opt/standup-backend

# 安装依赖
pnpm install --prod

# 生成Prisma客户端
pnpm prisma generate

# 构建项目
pnpm run build
```

#### 配置环境变量
```bash
# 创建生产环境配置
vi /opt/standup-backend/.env.production

# 内容如下：
NODE_ENV=production
PORT=3000

# 数据库配置
DATABASE_URL="mysql://standup_user:your_strong_password@localhost:3306/standup_tickets"

# JWT配置
JWT_SECRET=your_super_secure_jwt_secret_key_minimum_32_characters
JWT_EXPIRES_IN=7d

# 微信小程序配置
WECHAT_APP_ID=your_real_wechat_app_id
WECHAT_APP_SECRET=your_real_wechat_app_secret

# 微信支付配置
WECHAT_MCH_ID=your_merchant_id
WECHAT_MCH_KEY=your_merchant_key
WECHAT_CERT_PATH=/opt/standup-backend/certs/apiclient_cert.pem
WECHAT_KEY_PATH=/opt/standup-backend/certs/apiclient_key.pem

# 其他配置
BASE_URL=https://your-api-domain.com
UPLOAD_PATH=/opt/standup-backend/uploads
STATIC_URL=https://your-api-domain.com/static
```

#### 数据库迁移
```bash
# 推送数据库结构
pnpm prisma db push

# 或使用迁移（推荐）
pnpm prisma migrate deploy
```

#### PM2启动应用
```bash
# 创建PM2配置文件
vi /opt/standup-backend/ecosystem.config.js

# 内容：
module.exports = {
  apps: [{
    name: 'standup-backend',
    script: 'dist/main.js',
    cwd: '/opt/standup-backend',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 2,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: '/var/log/standup/error.log',
    out_file: '/var/log/standup/out.log',
    log_file: '/var/log/standup/combined.log',
    time: true
  }]
}

# 创建日志目录
mkdir -p /var/log/standup

# 启动应用
pm2 start ecosystem.config.js --env production

# 保存PM2配置
pm2 save
```

### 2.4 部署前端应用

#### 构建前端
```bash
cd /opt/standup-backend/front

# 创建生产环境配置
vi .env.production
# 内容：
VITE_API_BASE_URL=https://your-api-domain.com/api

# 安装依赖
pnpm install

# 构建
pnpm run build

# 移动构建文件到nginx目录
cp -r dist/* /var/www/html/admin/
```

#### 配置Nginx
```bash
# 创建Nginx配置
vi /etc/nginx/sites-available/standup-backend

# 内容：
server {
    listen 80;
    server_name your-api-domain.com;
    
    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-api-domain.com;
    
    # SSL证书配置（稍后配置）
    ssl_certificate /etc/ssl/certs/your-domain.crt;
    ssl_certificate_key /etc/ssl/private/your-domain.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!aNULL:!MD5:!ADH:!RC4;
    
    # API代理
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # 静态文件
    location /static/ {
        alias /opt/standup-backend/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # 管理后台
    location /admin/ {
        alias /var/www/html/admin/;
        try_files $uri $uri/ /admin/index.html;
        
        # SPA路由支持
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # 健康检查
    location /health {
        proxy_pass http://localhost:3000;
        access_log off;
    }
    
    # 安全headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
}

# 启用配置
ln -s /etc/nginx/sites-available/standup-backend /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# 测试配置
nginx -t

# 重启Nginx
systemctl reload nginx
```

---

## 3. 微信支付接入

### 3.1 申请微信支付商户号

#### 申请流程
1. 登录 [微信支付商户平台](https://pay.weixin.qq.com)
2. 申请成为商户（需要营业执照）
3. 签署协议、验证打款
4. 获得商户号（mch_id）

#### 获取必要信息
```javascript
// 商户平台 → 账户中心 → API安全
const wechatPayConfig = {
  appId: 'wx1234567890abcdef',           // 小程序AppID
  mchId: '1234567890',                   // 商户号
  apiKey: 'your32charactersAPIkey123456', // APIv2密钥
  certPath: './cert/apiclient_cert.pem', // 证书文件
  keyPath: './cert/apiclient_key.pem'    // 私钥文件
}
```

#### 下载证书文件
```bash
# 商户平台下载证书后上传到服务器
scp apiclient_cert.pem root@your-server-ip:/opt/standup-backend/certs/
scp apiclient_key.pem root@your-server-ip:/opt/standup-backend/certs/

# 设置权限
chmod 600 /opt/standup-backend/certs/*
```

### 3.2 配置支付回调地址

#### 设置通知URL
在商户平台 → 产品中心 → 开发配置 → 支付配置：
```
支付结果通知URL: https://your-api-domain.com/api/payments/wechat/notify
```

### 3.3 更新支付代码（生产版本）

创建真实的微信支付服务：

```bash
# 创建真实支付服务
vi /opt/standup-backend/src/payments/wechat-pay.service.ts
```

```typescript
// 生产级微信支付服务
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as fs from 'fs';
import axios from 'axios';
import * as xml2js from 'xml2js';

@Injectable()
export class WeChatPayService {
  private readonly logger = new Logger(WeChatPayService.name);
  
  constructor(private configService: ConfigService) {}

  async createUnifiedOrder(orderData: any) {
    const {
      outTradeNo,
      body,
      totalFee,
      openid,
      notifyUrl
    } = orderData;

    const params = {
      appid: this.configService.get('WECHAT_APP_ID'),
      mch_id: this.configService.get('WECHAT_MCH_ID'),
      nonce_str: this.generateNonceStr(),
      body,
      out_trade_no: outTradeNo,
      total_fee: totalFee,
      spbill_create_ip: '127.0.0.1',
      notify_url: notifyUrl,
      trade_type: 'JSAPI',
      openid
    };

    // 生成签名
    params['sign'] = this.generateSign(params);

    // 构建XML
    const xml = this.buildXml(params);

    try {
      const response = await axios.post(
        'https://api.mch.weixin.qq.com/pay/unifiedorder',
        xml,
        {
          headers: { 'Content-Type': 'application/xml' },
          timeout: 30000
        }
      );

      const result = await this.parseXml(response.data);
      
      if (result.return_code === 'SUCCESS' && result.result_code === 'SUCCESS') {
        return {
          prepayId: result.prepay_id,
          ...this.generatePaySign(result.prepay_id)
        };
      } else {
        throw new Error(`微信支付错误: ${result.err_code_des || result.return_msg}`);
      }
    } catch (error) {
      this.logger.error('微信支付统一下单失败', error);
      throw error;
    }
  }

  async processNotify(xmlData: string) {
    try {
      const data = await this.parseXml(xmlData);
      
      // 验证签名
      if (!this.verifySign(data)) {
        this.logger.error('微信支付回调签名验证失败');
        return this.buildNotifyResponse('FAIL', '签名验证失败');
      }

      if (data.return_code === 'SUCCESS' && data.result_code === 'SUCCESS') {
        // 处理支付成功逻辑
        await this.handlePaymentSuccess(data);
        return this.buildNotifyResponse('SUCCESS', 'OK');
      } else {
        this.logger.error('微信支付回调失败', data);
        return this.buildNotifyResponse('FAIL', '支付失败');
      }
    } catch (error) {
      this.logger.error('处理微信支付回调异常', error);
      return this.buildNotifyResponse('FAIL', '处理异常');
    }
  }

  private generateSign(params: any): string {
    const keys = Object.keys(params).sort();
    const stringA = keys
      .filter(key => params[key] && key !== 'sign')
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    const stringSignTemp = `${stringA}&key=${this.configService.get('WECHAT_MCH_KEY')}`;
    return crypto.createHash('md5').update(stringSignTemp).digest('hex').toUpperCase();
  }

  private generatePaySign(prepayId: string) {
    const appId = this.configService.get('WECHAT_APP_ID');
    const timeStamp = Math.floor(Date.now() / 1000).toString();
    const nonceStr = this.generateNonceStr();
    const packageStr = `prepay_id=${prepayId}`;
    const signType = 'MD5';

    const params = {
      appId,
      timeStamp,
      nonceStr,
      package: packageStr,
      signType
    };

    const paySign = this.generateSign(params);

    return {
      appId,
      timeStamp,
      nonceStr,
      package: packageStr,
      signType,
      paySign
    };
  }

  private generateNonceStr(): string {
    return Math.random().toString(36).substr(2, 15);
  }

  private buildXml(params: any): string {
    const builder = new xml2js.Builder({ rootName: 'xml', headless: true });
    return builder.buildObject(params);
  }

  private parseXml(xml: string): Promise<any> {
    return new Promise((resolve, reject) => {
      xml2js.parseString(xml, { explicitArray: false }, (err, result) => {
        if (err) reject(err);
        else resolve(result.xml);
      });
    });
  }

  private verifySign(data: any): boolean {
    const sign = data.sign;
    delete data.sign;
    const computedSign = this.generateSign(data);
    return sign === computedSign;
  }

  private buildNotifyResponse(returnCode: string, returnMsg: string): string {
    return `<xml><return_code><![CDATA[${returnCode}]]></return_code><return_msg><![CDATA[${returnMsg}]]></return_msg></xml>`;
  }

  private async handlePaymentSuccess(data: any) {
    // 更新订单状态为已支付
    // 这里调用订单服务更新状态
    this.logger.log(`订单 ${data.out_trade_no} 支付成功，交易号：${data.transaction_id}`);
  }
}
```

### 3.4 安装支付相关依赖

```bash
cd /opt/standup-backend

# 安装XML处理库
pnpm add xml2js
pnpm add -D @types/xml2js

# 重新构建
pnpm run build

# 重启应用
pm2 restart standup-backend
```

---

## 4. 域名与SSL配置

### 4.1 域名解析配置

#### 购买域名
- 阿里云万网、腾讯云、GoDaddy等平台购买
- 建议选择 `.com` 域名

#### DNS解析配置
```
类型  主机记录  解析路径         TTL
A     @        your-server-ip   600
A     api      your-server-ip   600  
A     admin    your-server-ip   600
```

#### 域名备案（国内服务器必须）
1. 在云服务商处申请备案
2. 提交资料（身份证、营业执照等）
3. 等待审核通过（通常7-20天）

### 4.2 SSL证书配置

#### 方法1：Let's Encrypt免费证书
```bash
# 安装Certbot
apt install -y certbot python3-certbot-nginx

# 申请证书
certbot --nginx -d your-api-domain.com

# 自动续期
crontab -e
# 添加：0 12 * * * /usr/bin/certbot renew --quiet
```

#### 方法2：云服务商SSL证书
```bash
# 下载证书文件并上传到服务器
mkdir -p /etc/ssl/certs/
mkdir -p /etc/ssl/private/

# 上传证书文件
scp your-domain.crt root@your-server-ip:/etc/ssl/certs/
scp your-domain.key root@your-server-ip:/etc/ssl/private/

# 设置权限
chmod 644 /etc/ssl/certs/your-domain.crt
chmod 600 /etc/ssl/private/your-domain.key
```

### 4.3 更新Nginx配置

```bash
# 更新SSL配置
vi /etc/nginx/sites-available/standup-backend

# 更新证书路径
ssl_certificate /etc/letsencrypt/live/your-api-domain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/your-api-domain.com/privkey.pem;

# 重启Nginx
systemctl reload nginx
```

---

## 5. 生产环境优化

### 5.1 数据库优化

#### MySQL配置优化
```bash
# 编辑MySQL配置
vi /etc/mysql/mysql.conf.d/mysqld.cnf

# 添加优化配置
[mysqld]
# 基础配置
max_connections = 200
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT

# 查询缓存
query_cache_type = 1
query_cache_size = 64M

# 慢查询日志
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2

# 重启MySQL
systemctl restart mysql
```

#### 数据库索引优化
```sql
-- 登录后台执行优化SQL
mysql -u root -p standup_tickets << EOF

-- 创建复合索引优化查询
CREATE INDEX idx_events_tenant_status_date ON events(tenant_id, status, event_date);
CREATE INDEX idx_orders_tenant_status_created ON orders(tenant_id, status, created_at DESC);
CREATE INDEX idx_orders_user_created ON orders(user_id, created_at DESC);

-- 分析表统计信息
ANALYZE TABLE events;
ANALYZE TABLE orders;
ANALYZE TABLE users;
ANALYZE TABLE price_options;
ANALYZE TABLE tickets;

EOF
```

### 5.2 应用性能优化

#### Node.js应用优化
```javascript
// 更新ecosystem.config.js
module.exports = {
  apps: [{
    name: 'standup-backend',
    script: 'dist/main.js',
    cwd: '/opt/standup-backend',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      // Node.js优化参数
      NODE_OPTIONS: '--max-old-space-size=2048'
    },
    instances: 'max',  // 使用所有CPU核心
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '2G',
    node_args: [
      '--max-old-space-size=2048'
    ],
    // 日志配置
    error_file: '/var/log/standup/error.log',
    out_file: '/var/log/standup/out.log',
    log_file: '/var/log/standup/combined.log',
    time: true,
    // 优雅重启
    kill_timeout: 5000,
    listen_timeout: 8000,
    // 环境变量
    env_production: {
      NODE_ENV: 'production'
    }
  }]
}
```

#### Redis缓存配置
```bash
# 安装Redis
apt install -y redis-server

# 配置Redis
vi /etc/redis/redis.conf

# 主要配置项
maxmemory 512mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000

# 启动Redis
systemctl start redis-server
systemctl enable redis-server

# 测试连接
redis-cli ping
```

#### 应用集成Redis缓存
```bash
cd /opt/standup-backend

# 安装Redis客户端
pnpm add ioredis
pnpm add -D @types/ioredis

# 更新环境变量
echo "REDIS_HOST=localhost" >> .env.production
echo "REDIS_PORT=6379" >> .env.production

# 重新构建和重启
pnpm run build
pm2 restart standup-backend
```

### 5.3 Nginx性能优化

```bash
# 优化Nginx配置
vi /etc/nginx/nginx.conf

# 主要优化项
user www-data;
worker_processes auto;
worker_connections 2048;

# 开启gzip压缩
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_proxied any;
gzip_comp_level 6;
gzip_types
    text/plain
    text/css
    text/xml
    text/javascript
    application/json
    application/javascript
    application/xml+rss
    application/atom+xml
    image/svg+xml;

# 缓存配置
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# 重启Nginx
systemctl reload nginx
```

---

## 6. 监控与运维

### 6.1 系统监控

#### 安装监控工具
```bash
# 安装htop和iotop
apt install -y htop iotop nethogs

# 安装Node.js应用监控
npm install -g pm2-logrotate
pm2 install pm2-auto-pull

# 配置日志轮转
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

#### PM2监控
```bash
# PM2基本监控
pm2 status
pm2 logs
pm2 monit

# 查看应用详情
pm2 show standup-backend

# 重启应用
pm2 restart standup-backend

# 查看资源使用
pm2 list
```

### 6.2 日志管理

#### 应用日志配置
```bash
# 创建日志轮转配置
vi /etc/logrotate.d/standup-backend

# 内容：
/var/log/standup/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        pm2 reloadLogs
    endscript
}
```

#### 系统日志监控
```bash
# 查看系统日志
journalctl -u nginx -f
journalctl -u mysql -f

# 查看错误日志
tail -f /var/log/nginx/error.log
tail -f /var/log/mysql/error.log
```

### 6.3 备份策略

#### 数据库备份
```bash
# 创建备份脚本
vi /opt/backup-db.sh

#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="standup_tickets"

mkdir -p $BACKUP_DIR

# 数据库备份
mysqldump -u root -p$DB_PASSWORD $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# 压缩备份
gzip $BACKUP_DIR/db_backup_$DATE.sql

# 删除30天前的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "数据库备份完成: $BACKUP_DIR/db_backup_$DATE.sql.gz"

# 设置执行权限
chmod +x /opt/backup-db.sh

# 设置定时任务
crontab -e
# 添加：0 2 * * * /opt/backup-db.sh
```

#### 文件备份
```bash
# 应用代码备份
tar -czf /opt/backups/app_backup_$(date +%Y%m%d).tar.gz /opt/standup-backend

# 上传文件备份
tar -czf /opt/backups/uploads_backup_$(date +%Y%m%d).tar.gz /opt/standup-backend/uploads
```

### 6.4 安全配置

#### 防火墙配置
```bash
# 安装ufw防火墙
apt install -y ufw

# 配置防火墙规则
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp

# 启用防火墙
ufw enable

# 查看状态
ufw status verbose
```

#### 系统安全加固
```bash
# 禁用root SSH登录
vi /etc/ssh/sshd_config
# 修改：PermitRootLogin no

# 创建普通用户
adduser deploy
usermod -aG sudo deploy

# 配置SSH密钥认证
# ...（省略详细步骤）

# 自动安全更新
apt install -y unattended-upgrades
dpkg-reconfigure unattended-upgrades
```

---

## 7. 上线检查清单

### 7.1 上线前检查

- [ ] **域名配置**
  - [ ] 域名解析正确
  - [ ] SSL证书有效
  - [ ] 备案完成（国内）

- [ ] **微信配置**
  - [ ] 小程序审核通过
  - [ ] 服务器域名配置
  - [ ] 微信支付商户审核

- [ ] **服务器配置**
  - [ ] 环境变量正确
  - [ ] 数据库连接正常
  - [ ] 应用正常启动
  - [ ] Nginx配置正确

- [ ] **功能测试**
  - [ ] 用户登录注册
  - [ ] 演出查看预订
  - [ ] 订单创建支付
  - [ ] 管理后台功能

### 7.2 监控告警配置

```bash
# 创建健康检查脚本
vi /opt/health-check.sh

#!/bin/bash
API_URL="https://your-api-domain.com/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $API_URL)

if [ $RESPONSE -ne 200 ]; then
    echo "API健康检查失败，状态码：$RESPONSE" | mail -s "API告警" admin@yourdomain.com
    # 或者通过企业微信、钉钉等发送告警
fi

# 设置定时检查
crontab -e
# 添加：*/5 * * * * /opt/health-check.sh
```

---

## 8. 常见问题解决

### 8.1 部署问题

**Q: PM2启动失败**
```bash
# 检查日志
pm2 logs standup-backend

# 检查环境变量
pm2 env 0

# 重新加载环境
pm2 restart standup-backend --update-env
```

**Q: 数据库连接失败**
```bash
# 检查MySQL状态
systemctl status mysql

# 测试连接
mysql -u standup_user -p standup_tickets

# 检查防火墙
ufw status
```

**Q: Nginx配置错误**
```bash
# 测试配置
nginx -t

# 查看错误日志
tail -f /var/log/nginx/error.log

# 重新加载配置
systemctl reload nginx
```

### 8.2 微信支付问题

**Q: 支付参数签名错误**
- 检查商户密钥是否正确
- 确认参数顺序和格式
- 验证时间戳和随机字符串

**Q: 支付回调失败**
- 检查回调URL是否可访问
- 验证SSL证书有效性
- 确认XML解析正确

### 8.3 性能问题

**Q: 接口响应慢**
```bash
# 查看数据库慢查询
cat /var/log/mysql/slow.log

# 检查服务器资源
htop
iotop

# 查看应用日志
pm2 logs standup-backend
```

**Q: 内存占用高**
```bash
# 查看进程内存
ps aux | grep node

# 重启应用释放内存
pm2 restart standup-backend
```

---

## 🎉 总结

按照这份完整指南，您可以：

1. ✅ **完成微信小程序对接** - 实现登录、支付等核心功能
2. ✅ **部署到生产服务器** - 包含完整的环境配置和优化
3. ✅ **接入真实微信支付** - 支持正式的支付流程
4. ✅ **配置监控和运维** - 确保系统稳定运行
5. ✅ **制定备份和安全策略** - 保障数据安全

这样就能将您的脱口秀票务系统正式上线运营了！🚀

如有任何问题，请参考文档中的故障排除部分或联系技术支持。