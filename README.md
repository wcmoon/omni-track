# OmniTrack - 智能时间追踪与任务管理系统

## 🎯 项目简介

OmniTrack 是一个基于AI的智能时间追踪和任务管理应用，帮助用户更好地管理时间、任务和生活记录。

## 🏗️ 项目结构

```
omni-track/
├── 📱 omni-track-app/           # React Native前端应用
├── 🖥️ omni-track-backend/       # NestJS后端API服务
├── 🌐 timeweave-website/        # 产品官网
├── 🔧 dev-tools/                # 开发辅助工具和脚本
├── 📋 PRODUCT_DOCUMENTATION.md  # 完整产品文档
└── 📖 README.md                 # 项目说明文档
```

## 🚀 快速开始

### 后端服务
```bash
cd omni-track-backend
yarn install
yarn start:dev
```

### 前端应用
```bash
cd omni-track-app
yarn install
yarn start
```

### 官网
```bash
cd timeweave-website
# 静态网站，直接打开 index.html
```

## ✨ 核心功能

- 🤖 **AI智能分析**: 任务优先级评估、时间预估、生活模式分析
- 📋 **任务管理**: 创建、编辑、分类、搜索任务
- 📊 **数据仪表盘**: 可视化进度、统计分析、个性化建议
- 📝 **生活日志**: 记录生活点滴、情感分析、趋势追踪
- 🔄 **智能提醒**: 基于AI的个性化提醒和建议

## 🛠️ 技术栈

### 前端
- React Native + Expo
- TypeScript
- Context API状态管理
- Axios HTTP客户端

### 后端
- NestJS框架
- TypeORM + PostgreSQL
- Redis缓存
- OpenAI API集成
- JWT认证

### 部署
- Docker容器化
- 环境变量配置
- 自动化CI/CD

## 📚 文档导航

### 📖 核心文档
- [产品完整文档](./PRODUCT_DOCUMENTATION.md)
- [后端API文档](./omni-track-backend/docs/API_DOCUMENTATION.md)
- [重构总结](./omni-track-backend/docs/REFACTORING_SUMMARY.md)

### 🤖 AI功能文档
- [智能TODO功能](./omni-track-backend/docs/SMART_TODO_FEATURES.md)
- [智能日志功能](./omni-track-backend/docs/SMART_LOG_FEATURES.md)

### 🛠️ 开发指南
- [错误处理指南](./omni-track-app/ERROR_HANDLING_GUIDE.md)
- [前端验证指南](./dev-tools/frontend-validation-guide.md)

## 🎨 界面预览

### 主要页面
- **智能仪表盘**: 数据概览和AI建议
- **任务管理**: 快速创建和管理任务
- **生活日志**: 记录和分析生活数据
- **AI助手**: 智能对话和建议

### 核心组件
- 快速创建弹窗
- 时间分析卡片
- 进度可视化
- 智能提醒卡片

## 🔐 安全特性

- JWT Token认证
- 密码加密存储
- API路由保护
- 用户数据隔离

## 🚀 部署说明

### 开发环境
```bash
# 启动后端
cd omni-track-backend && yarn start:dev

# 启动前端
cd omni-track-app && yarn start
```

### 生产环境
- 配置环境变量
- 数据库迁移
- Redis服务
- 反向代理配置

## 📈 项目状态

### ✅ 已完成
- 用户认证系统
- 任务管理功能
- 日志记录系统
- AI分析集成
- 移动端应用
- 后端API服务

### 🔄 开发中
- 团队协作功能
- 数据导入导出
- 高级分析报告

### 📋 计划中
- 桌面端应用
- 第三方集成
- 企业版功能

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交变更
4. 推送到分支
5. 创建Pull Request

## 📄 许可证

MIT License

## 📞 联系我们

- 📧 邮箱: support@omnitrack.com
- 🐙 GitHub: [OmniTrack Repository]
- 🌐 官网: [timeweave-website]

---

*最后更新: 2025-07-18*
*版本: v1.0.0*