# 皮皮伞 Keys 管理系统 v2.2

一个基于 Next.js 14 + Supabase 的现代化密钥分发与管理系统，专为特定社群设计。系统采用 QQ 邮箱注册机制，提供密钥领取、贡献者排行榜互动等功能，并配备完善的后台管理系统。

## 🌟 功能特性

### 👤 用户端功能
- **🔐 QQ 邮箱注册登录**：用户使用 QQ 号作为邮箱前缀进行注册，确保身份与 QQ 号强绑定
- **📧 邮箱验证码**：注册时发送验证码到 QQ 邮箱，确保邮箱有效性
- **🎯 一键领取密钥**：登录后可直接领取专属密钥，支持一键复制
- **🏆 贡献者排行榜**：查看贡献者排行，支持点赞互动和粉丝牌功能
- **🔗 API 调用地址**：提供可配置的 API 基础地址，支持一键复制
- **📱 响应式设计**：完美适配桌面端和移动端，优化移动端用户体验
- **🎨 现代化 UI**：基于 Tailwind CSS 的精美界面设计

### 🛠️ 管理员功能
- **👥 用户管理**：查看所有用户、封禁/解封用户、删除用户账户
- **🔑 密钥管理**：批量添加密钥、查看密钥状态、自动失效机制
- **🏅 贡献者管理**：添加/编辑/删除贡献者、管理积分和头像
- **📋 白名单管理**：批量导入白名单、对比现有用户、管理准入名单
- **📊 数据统计**：实时查看用户数量、密钥使用情况、系统运行状态
- **📝 操作日志**：完整的管理员操作审计日志，支持清理功能
- **⚙️ 系统设置**：配置 API 地址、管理员账户、修改密码等
- **🔧 管理员设置**：创建和管理管理员账户

## 🛠️ 技术栈

- **前端框架**: Next.js 14 (App Router)
- **开发语言**: TypeScript
- **样式框架**: Tailwind CSS + PostCSS + Autoprefixer
- **UI 组件**: Heroicons + React Hot Toast
- **数据库**: Supabase (PostgreSQL)
- **身份验证**: 自定义认证系统 + bcryptjs 密码加密
- **邮件服务**: Nodemailer + QQ 邮箱 SMTP
- **部署平台**: Vercel
- **开发工具**: ESLint + Prettier + TypeScript

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/andclear/little-stone-keys-managers.git
cd little-stone-keys-managers
```

### 2. 安装依赖

```bash
npm install
```

### 3. 环境配置

复制环境变量示例文件：

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，填入你的配置：

```env
# Supabase 数据库配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# 默认管理员账户（首次部署后请及时修改）
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=admin123

# QQ 邮箱 SMTP 服务配置
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_USER=your_qq_email@qq.com
SMTP_PASS=your_qq_email_authorization_code
```

> **重要提示**：
> - `SUPABASE_SERVICE_ROLE_KEY` 用于管理员操作，请确保安全保存
> - `SMTP_PASS` 是 QQ 邮箱的授权码，不是登录密码
> - 生产环境部署后请立即修改默认管理员密码

### 4. 数据库初始化

1. 在 [Supabase 控制台](https://supabase.com) 创建新项目
2. 复制项目 URL 和 API 密钥到环境变量
3. 在 Supabase SQL 编辑器中执行 `database/init.sql` 脚本
4. 确认所有表、索引、触发器和视图创建成功

### 5. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看用户端界面

访问 [http://localhost:3000/admin/login](http://localhost:3000/admin/login) 进入管理后台

**默认管理员账户**：
- 用户名：`admin`
- 密码：`admin123`

## 📁 项目结构

```
little-stone-keys-managers/
├── app/                    # Next.js 14 App Router
│   ├── admin/             # 管理后台页面
│   │   ├── contributors/  # 贡献者管理
│   │   ├── dashboard/     # 数据统计仪表板
│   │   ├── keys/          # 密钥管理
│   │   ├── login/         # 管理员登录
│   │   ├── logs/          # 操作日志
│   │   ├── settings/      # 系统设置
│   │   ├── users/         # 用户管理
│   │   └── whitelist/     # 白名单管理
│   ├── api/               # API 路由
│   │   ├── admin/         # 管理员 API
│   │   ├── auth/          # 用户认证 API
│   │   ├── keys/          # 密钥相关 API
│   │   ├── likes/         # 点赞功能 API
│   │   ├── send-verification/ # 验证码发送 API
│   │   └── users/         # 用户相关 API
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局组件
│   └── page.tsx           # 用户端首页
├── lib/                   # 工具库
│   ├── config.ts          # 统一配置文件
│   ├── supabase.ts        # Supabase 客户端
│   ├── utils.ts           # 通用工具函数
│   └── email.ts           # 邮件服务
├── database/              # 数据库相关
│   └── init.sql           # 数据库初始化脚本
├── .env.example           # 环境变量示例
├── package.json           # 项目依赖配置
├── tailwind.config.js     # Tailwind CSS 配置
├── tsconfig.json          # TypeScript 配置
└── next.config.js         # Next.js 配置
```


## 🗄️ 数据库设计

### 核心表结构

#### 用户相关
- **`users`** - 用户表（以 QQ 号为主键）
  - `id` (BIGINT) - QQ 号作为主键
  - `nickname` (VARCHAR) - 用户昵称
  - `email` (VARCHAR) - QQ 邮箱地址
  - `password_hash` (VARCHAR) - 加密密码
  - `is_banned` (BOOLEAN) - 封禁状态
  - `created_at` (TIMESTAMPTZ) - 注册时间

#### 密钥相关
- **`keys`** - 密钥表
  - `id` (SERIAL) - 自增主键
  - `key_value` (VARCHAR) - 密钥值（唯一）
  - `status` (VARCHAR) - 状态：unclaimed/claimed/void
  - `claimed_by_user_id` (BIGINT) - 领取用户 ID
  - `claimed_at` (TIMESTAMPTZ) - 领取时间

#### 贡献者相关
- **`contributors`** - 贡献者表
  - `id` (SERIAL) - 自增主键
  - `nickname` (VARCHAR) - 贡献者昵称
  - `avatar_url` (VARCHAR) - 头像地址
  - `points` (INT) - 贡献积分
  - `likes_count` (INT) - 点赞总数
  - `created_at` (TIMESTAMPTZ) - 创建时间

- **`likes`** - 点赞记录表
  - `user_id` (BIGINT) - 用户 ID（复合主键）
  - `contributor_id` (INT) - 贡献者 ID（复合主键）
  - `fan_badge_number` (INT) - 粉丝牌编号（001-999）
  - `created_at` (TIMESTAMPTZ) - 点赞时间

#### 管理相关
- **`admins`** - 管理员表
  - `id` (SERIAL) - 自增主键
  - `username` (VARCHAR) - 管理员用户名
  - `password_hash` (VARCHAR) - 加密密码
  - `last_login` (TIMESTAMPTZ) - 最后登录时间
  - `created_at` (TIMESTAMPTZ) - 创建时间

- **`audit_logs`** - 操作日志表
  - `id` (SERIAL) - 自增主键
  - `admin_id` (INT) - 管理员 ID
  - `action` (TEXT) - 操作描述
  - `created_at` (TIMESTAMPTZ) - 操作时间

- **`whitelist`** - 白名单表
  - `id` (SERIAL) - 自增主键
  - `qq_number` (BIGINT) - QQ 号（唯一）
  - `created_at` (TIMESTAMPTZ) - 添加时间

#### 系统相关
- **`system_config`** - 系统配置表
  - `id` (SERIAL) - 自增主键
  - `key` (VARCHAR) - 配置键（唯一）
  - `value` (TEXT) - 配置值
  - `updated_at` (TIMESTAMPTZ) - 更新时间

- **`verification_codes`** - 验证码表
  - `id` (SERIAL) - 自增主键
  - `email` (VARCHAR) - 邮箱地址
  - `code` (VARCHAR) - 验证码
  - `created_at` (TIMESTAMPTZ) - 创建时间
  - `expires_at` (TIMESTAMPTZ) - 过期时间
  - `used` (BOOLEAN) - 是否已使用

### 🔧 数据库特性

#### 自动化触发器
- **用户封禁/删除触发器**：自动将用户密钥设为失效状态
- **验证码清理触发器**：自动清理过期验证码，防止垃圾数据
- **点赞数统计触发器**：自动维护贡献者点赞总数

#### 性能优化
- **索引优化**：关键查询字段建立索引，提升查询性能
- **复合主键**：点赞记录表使用复合主键，避免重复点赞
- **状态约束**：密钥状态使用 CHECK 约束，确保数据一致性

#### 数据视图
- **`user_key_info`** - 用户密钥信息视图
- **`contributor_leaderboard`** - 贡献者排行榜视图

#### 数据完整性
- **外键约束**：确保数据关联完整性
- **级联删除**：用户删除时自动清理相关数据
- **唯一约束**：防止重复数据（邮箱、密钥值等）

## 🚀 部署指南

### Vercel 部署（推荐）

1. **准备代码仓库**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Vercel 部署步骤**
   - 访问 [Vercel 控制台](https://vercel.com)
   - 点击 "New Project" 导入 GitHub 仓库
   - 选择 `little-stone-keys-managers` 项目
   - 配置环境变量（见下方配置清单）
   - 点击 "Deploy" 开始部署

3. **生产环境变量配置**
   ```env
   # Supabase 生产环境配置
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
   
   # 生产环境管理员账户（部署后立即修改）
   DEFAULT_ADMIN_USERNAME=your_admin_username
   DEFAULT_ADMIN_PASSWORD=your_secure_password
   
   # QQ 邮箱 SMTP 配置
   SMTP_HOST=smtp.qq.com
   SMTP_PORT=587
   SMTP_USER=your_production_email@qq.com
   SMTP_PASS=your_email_authorization_code
   ```

4. **部署后检查清单**
   - ✅ 访问生产环境 URL 确认用户端正常
   - ✅ 访问 `/admin/login` 确认管理后台可访问
   - ✅ 测试用户注册和邮箱验证功能
   - ✅ 测试密钥领取功能
   - ✅ 立即修改默认管理员密码

### 其他部署方式

#### 自托管部署
```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

### 🚨 生产环境安全检查清单
- [ ] 修改默认管理员账户和密码
- [ ] 确认所有环境变量正确配置
- [ ] 验证 HTTPS 证书有效
- [ ] 测试邮件发送功能
- [ ] 检查数据库访问权限
- [ ] 设置适当的 CORS 策略
- [ ] 启用生产环境日志记录
- [ ] 配置备份策略

## 💻 开发指南

### 🔧 开发环境设置

```bash
# 克隆项目
git clone https://github.com/andclear/little-stone-keys-managers.git
cd little-stone-keys-managers

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 代码检查
npm run lint

# 构建项目
npm run build
```

### 📝 代码规范

#### TypeScript 规范
- **严格类型检查**：启用 TypeScript 严格模式
- **接口定义**：为所有数据结构定义 TypeScript 接口
- **类型导入**：使用 `import type` 导入类型定义
- **错误处理**：使用类型安全的错误处理模式

#### 代码风格
- **ESLint**：遵循 Next.js 推荐的 ESLint 配置
- **Prettier**：自动格式化代码，保持一致性
- **命名规范**：
  - 组件使用 PascalCase（如 `UserProfile`）
  - 函数使用 camelCase（如 `getUserData`）
  - 常量使用 UPPER_SNAKE_CASE（如 `API_BASE_URL`）
  - 文件名使用 kebab-case（如 `user-profile.tsx`）

#### 项目结构规范
- **页面组件**：放在 `app/` 目录下，使用 App Router
- **API 路由**：放在 `app/api/` 目录下，按功能模块组织
- **工具函数**：放在 `lib/` 目录下，按用途分类
- **类型定义**：在文件内定义或使用全局类型文件

### 🎨 样式指南

#### Tailwind CSS 使用规范
- **响应式优先**：移动端优先设计，使用 `sm:`、`md:`、`lg:` 等断点
- **组件化**：复用的样式组合提取为组件
- **语义化类名**：使用有意义的 CSS 类名组合
- **性能优化**：避免不必要的样式类，保持 CSS 包体积最小

#### UI 设计原则
- **一致性**：保持整个应用的视觉风格一致
- **可访问性**：确保良好的对比度和键盘导航支持
- **响应式**：适配各种屏幕尺寸和设备
- **加载状态**：为异步操作提供适当的加载提示

### 🧪 测试指南

#### API 测试
```bash
# 测试用户注册
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"qq":"123456789","nickname":"测试用户","password":"password123"}'

# 测试管理员登录
curl -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

#### 功能测试清单
- [ ] 用户注册和邮箱验证
- [ ] 用户登录和会话管理
- [ ] 密钥领取功能
- [ ] 贡献者点赞功能
- [ ] 管理员登录和权限验证
- [ ] 用户管理（查看、封禁、删除）
- [ ] 密钥管理（添加、查看、状态更新）
- [ ] 白名单管理和对比功能


## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)。


## 🙏 致谢

感谢所有为项目做出贡献的开发者和用户！

### 🌟 贡献者

<div align="center">
  <table>
    <tr>
      <td align="center" width="120">
        <img src="https://cdn.jsdelivr.net/gh/andclear/touxiang@main/assets/avatars/suifeng.jpg" width="80" height="80" style="border-radius: 50%; object-fit: cover; min-width: 80px; min-height: 80px;" alt="随风飘逸" /><br />
        <sub><b>随风飘逸</b></sub>
      </td>
      <td align="center" width="120">
        <img src="https://cdn.jsdelivr.net/gh/andclear/touxiang@main/assets/avatars/wanwan.png" width="80" height="80" style="border-radius: 50%; object-fit: cover; min-width: 80px; min-height: 80px;" alt="菀菀呀呀呀" /><br />
        <sub><b>菀菀呀呀呀</b></sub>
      </td>
      <td align="center" width="120">
        <img src="https://cdn.jsdelivr.net/gh/andclear/touxiang@main/assets/avatars/pika.jpg" width="80" height="80" style="border-radius: 50%; object-fit: cover; min-width: 80px; min-height: 80px;" alt="超级赞皮卡" /><br />
        <sub><b>超级赞皮卡</b></sub>
      </td>
      <td align="center" width="120">
        <img src="https://cdn.jsdelivr.net/gh/andclear/touxiang@main/assets/avatars/laopobao.jpg" width="80" height="80" style="border-radius: 50%; object-fit: cover; min-width: 80px; min-height: 80px;" alt="老婆宝" /><br />
        <sub><b>老婆宝</b></sub>
      </td>
      <td align="center" width="120">
        <img src="https://cdn.jsdelivr.net/gh/andclear/touxiang@main/assets/avatars/suannai.jpg" width="80" height="80" style="border-radius: 50%; object-fit: cover; min-width: 80px; min-height: 80px;" alt="酸奶大王" /><br />
        <sub><b>酸奶大王</b></sub>
      </td>
    </tr>
    <tr>
      <td align="center" width="120">
        <img src="https://cdn.jsdelivr.net/gh/andclear/touxiang@main/assets/avatars/hajibao.jpg" width="80" height="80" style="border-radius: 50%; object-fit: cover; min-width: 80px; min-height: 80px;" alt="哈基暴" /><br />
        <sub><b>哈基暴</b></sub>
      </td>
      <td align="center" width="120">
        <img src="https://cdn.jsdelivr.net/gh/andclear/touxiang@main/assets/avatars/zao.jpg" width="80" height="80" style="border-radius: 50%; object-fit: cover; min-width: 80px; min-height: 80px;" alt="阿藻" /><br />
        <sub><b>阿藻</b></sub>
      </td>
      <td align="center" width="120">
        <img src="https://cdn.jsdelivr.net/gh/andclear/touxiang@main/assets/avatars/nuanyangyang.jpg" width="80" height="80" style="border-radius: 50%; object-fit: cover; min-width: 80px; min-height: 80px;" alt="暖阳洋" /><br />
        <sub><b>暖阳洋</b></sub>
      </td>
      <td align="center" width="120">
        <img src="https://cdn.jsdelivr.net/gh/andclear/touxiang@main/assets/avatars/wenjian.jpg" width="80" height="80" style="border-radius: 50%; object-fit: cover; min-width: 80px; min-height: 80px;" alt="小文件" /><br />
        <sub><b>小文件</b></sub>
      </td>
      <td align="center" width="120">
        <img src="https://cdn.jsdelivr.net/gh/andclear/touxiang@main/assets/avatars/niannian.jpg" width="80" height="80" style="border-radius: 50%; object-fit: cover; min-width: 80px; min-height: 80px;" alt="笨蛋跟着念" /><br />
        <sub><b>笨蛋跟着念</b></sub>
      </td>
    </tr>
  </table>
</div>

---