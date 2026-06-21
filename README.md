# 🧹 CF-Pages-Purge (Cloudflare Pages 历史版本清理工具)

一个基于 Cloudflare Workers 部署的免服务器、单文件、全图形化界面的 Cloudflare Pages 历史部署版本批量清理工具。

## ✨ 特性

- 🛠️ **免服务器部署**：纯 JavaScript 编写，利用 Cloudflare Workers 的 Fetch 架构，无任何外部依赖。
- 🛡️ **生产安全保护**：自动识别并锁定当前线上激活（Active）的版本以及绑定了别名（Aliases/自定义域名）的版本，禁止勾选，防止误删。
- 📊 **实时状态看板**：支持项目一键加载、部署列表实时拉取、多分支识别。
- 🔢 **智能选择计数**：支持一键全选/取消全选，实时显示已勾选的版本数量。
- 🎨 **现代化 UI 交互**：去除生硬的浏览器原生弹窗，引入优雅的居中模态确认框（Modal）与呼吸日志框。

---

## 🚀 快速开始

### 1. 部署到 Cloudflare Workers

1. 登录到 [Cloudflare 控制台](https://dash.cloudflare.com/)。
2. 点击左侧菜单的 **Workers & Pages** -> **Create** -> **Create Worker**。
3. 命名你的 Worker（例如 `cf-pages-purge`），点击 **Deploy**。
4. 点击 **Edit Code** 按钮，将本仓库的 `index.js` 代码完全覆盖进去。
5. 点击右上角的 **Save and deploy**。

### 2. 创建专属 API Token

为了确保账户安全，请勿使用 Global API Key。建议创建限定权限的自定义令牌：

1. 进入 Cloudflare **我的个人资料** -> **API 令牌 (API Tokens)**。
2. 点击 **创建令牌 (Create Token)** -> 选择最下方的 **创建自定义令牌 (Create Custom Token)**。
3. 配置权限参数：
   - **权限 (Permissions)**：选择 `账户 (Account)` -> `Cloudflare Pages` -> `编辑 (Edit)` **（必须为编辑权限才能执行删除）**
   - **账户资源 (Account Resources)**：选择 `包括 (Include)` -> `您的目标账户`
4. 复制并妥善保存生成的 Token。

---

## 💡 使用指南

1. 打开 Worker 为您分配的独立网址（例如 `https://cf-pages-purge.xxxx.workers.dev`）。
2. 输入您的 **Account ID**（可从 Cloudflare 账户首页 URL 中获取 32 位字符串）与刚才创建的 **API Token**。
3. 点击 **🔍 1. 加载项目列表**，从下拉菜单中选择您需要清理的 Pages 项目。
4. 点击 **📋 2. 获取部署列表**，系统会呈现所有历史版本。
5. 手动勾选或批量选择需要清理的旧版本，确认无误后点击 **🗑️ 3. 开始删除选中版本**。
6. 在弹出的精美确认框中确认，系统将以单线程平滑队列（每秒约 2 次请求）开始自动安全清理。

---

## 🔒 隐私与安全性

- **零数据外流**：本工具完全运行在您自己的 Cloudflare 账户基础架构内，所有请求均通过您部署的 Worker 直接转发给 Cloudflare 官方 API (`api.cloudflare.com`)。
- **本地存储**：Account ID 和 API Token 仅加密保存在您当前浏览器的本地缓存（LocalStorage）中，绝不会上传给任何第三方。
