 Mac 本地快速开始

  1. 安装必要软件

  # 安装 Homebrew（如果没有）
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

  # 安装 Node.js
  brew install node

  # 安装 pnpm
  npm install -g pnpm

  # 安装 MySQL
  brew install mysql
  brew services start mysql

  2. 启动后端

  cd standup-backend

  # 安装依赖
  pnpm install

  # 生成数据库客户端
  pnpm prisma generate

  # 创建数据库（首次运行）
  mysql -u root -p -e "CREATE DATABASE standup_tickets CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

  # 推送数据库结构
  pnpm prisma db push

  # 启动后端
  pnpm run start:dev

  3. 启动前端

  # 新终端窗口
  cd standup-backend/front

  # 安装依赖
  pnpm install

  # 启动前端
  pnpm dev

  🌟 跨平台特性

  ✅ Mac 优势

  - 开发体验更佳 - 终端、编辑器生态丰富
  - 性能优异 - 特别是 M1/M2 芯片
  - 调试便利 - Chrome DevTools 完美支持
  - 热重载快速 - 文件监听响应迅速

  ✅ 数据库选择

  如果不想安装 MySQL，还可以使用：
  - SQLite - 轻量级，无需额外安装
  - Docker MySQL - 容器化运行
  - 云数据库 - 如 PlanetScale

  修改为 SQLite（推荐测试用）

  // prisma/schema.prisma
  datasource db {
    provider = "sqlite"
    url      = "file:./dev.db"
  }

  # .env 
  DATABASE_URL="file:./dev.db"

  🔧 Mac 专用优化建议

  VS Code 推荐扩展

  {
    "recommendations": [
      "bradlc.vscode-tailwindcss",
      "esbenp.prettier-vscode",
      "ms-vscode.vscode-typescript-next",
      "Prisma.prisma"
    ]
  }

  Terminal 配置

  # 使用 iTerm2 + Oh My Zsh 提升终端体验
  # 配置 Node.js 版本管理
  brew install nvm

  🐳 Docker 选择（可选）

  如果你偏好容器化，也可以使用 Docker：

  # docker-compose.yml
  version: '3.8'
  services:
    mysql:
      image: mysql:8.0
      environment:
        MYSQL_DATABASE: standup_tickets
        MYSQL_ROOT_PASSWORD: password
      ports:
        - "3306:3306"