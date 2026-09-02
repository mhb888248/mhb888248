## Hi there 👋

<!--
**mhb888248/mhb888248** is a ✨ _special_ ✨ repository because its `README.md` (this file) appears on your GitHub profile.

Here are some ideas to get you started:

- 🔭 I’m currently working on ...
- 🌱 I’m currently learning ...
- 👯 I’m looking to collaborate on ...
- 🤔 I’m looking for help with ...
- 💬 Ask me about ...
- 📫 How to reach me: ...
- 😄 Pronouns: ...
- ⚡ Fun fact: ...
-->

## 项目文档

- [市西路社区卫生服务中心 AI 中医健康管理 SaaS 开发文档](docs/市西路社区卫生服务中心-AI中医健康管理SaaS开发文档.md)

## 本地开发（MVP 应用）

依据开发文档 §17.1 的 MVP 范围，仓库内实现了一个可运行的最小闭环：**活动获客 → 建档 → 指标采集 → 风险分层 → 随访 → 经营看板**。

- `backend/`：NestJS + Prisma（SQLite）后端 API，提供鉴权、居民档案、活动、指标导入、风险分层、随访计划与经营看板等接口。
- `frontend/`：Vue 3 + TypeScript + Element Plus 管理/医护工作台。

### 快速开始

```bash
# 安装依赖 + 初始化数据库 + 载入演示数据（幂等）
bash .cursor/install.sh

# 启动后端（终端 1）
cd backend && npm run start:dev   # http://localhost:3000/api

# 启动前端（终端 2）
cd frontend && npm run dev        # http://localhost:5173
```

演示账号：`admin / admin123`（管理员）、`doctor / doctor123`、`manager / manager123`。

Cloud Agent 环境通过 `.cursor/environment.json` 自动执行 `install` 并在 `terminals` 中启动上述两个服务。
