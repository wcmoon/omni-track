# OmniTrack 产品文档归纳

## 📋 项目概述

**OmniTrack** 是一个智能时间追踪和任务管理应用，集成了AI技术来帮助用户更好地管理时间、任务和生活日志。

### 🎯 核心功能
- **智能任务管理**: AI驱动的任务创建、分析和优化
- **多维日志系统**: 全面的生活记录和分析
- **智能仪表盘**: 个性化的数据洞察和建议
- **时间分析**: 深度的时间使用分析和优化建议

## 🏗️ 技术架构

### 前端 (React Native + Expo)
```
omni-track-app/
├── src/
│   ├── components/          # UI组件
│   │   ├── ai/             # AI相关组件
│   │   ├── dashboard/      # 仪表盘组件
│   │   ├── modals/         # 弹窗组件
│   │   └── task/           # 任务组件
│   ├── screens/            # 页面组件
│   ├── services/           # API服务
│   ├── context/            # 状态管理
│   └── utils/              # 工具函数
```

### 后端 (NestJS + TypeScript)
```
omni-track-backend/
├── src/
│   ├── config/             # 配置管理
│   ├── modules/            # 功能模块
│   │   ├── auth/          # 认证模块
│   │   ├── task/          # 任务管理
│   │   ├── log/           # 日志系统
│   │   ├── ai/            # AI服务
│   │   └── project/       # 项目管理
│   ├── database/          # 数据库实体
│   └── common/            # 通用组件
```

### 官网 (静态网站)
```
timeweave-website/
├── index.html              # 主页
├── styles.css              # 样式文件
└── logo.svg               # 品牌标识
```

## 📚 文档结构

### 🔧 技术文档
- **API文档**: `/omni-track-backend/docs/API_DOCUMENTATION.md`
- **API接口**: `/omni-track-backend/docs/API_ENDPOINTS.md`
- **重构总结**: `/omni-track-backend/docs/REFACTORING_SUMMARY.md`

### 🤖 AI功能文档
- **智能TODO**: `/omni-track-backend/docs/SMART_TODO_FEATURES.md`
- **智能日志**: `/omni-track-backend/docs/SMART_LOG_FEATURES.md`

### 🛠️ 开发指南
- **错误处理**: `/omni-track-app/ERROR_HANDLING_GUIDE.md`
- **前端验证**: `/frontend-validation-guide.md`

### 🧪 测试文件
- **任务创建测试**: `/test-task-creation.sh`
- **用户检查**: `/check-users.js`
- **错误调试**: `/debug-400-error.js`

## 🎨 用户界面

### 主要页面
1. **仪表盘** (`DashboardScreen.tsx`)
   - 智能提醒和建议
   - 生活质量评分
   - 进度可视化

2. **任务管理** (`TasksScreen.tsx`)
   - 任务列表和筛选
   - 快速创建任务
   - 时间分析

3. **日志系统** (`LogsScreen.tsx`)
   - 生活记录
   - 情感分析
   - 数据统计

4. **AI助手** (`AIAssistantScreen.tsx`)
   - 智能对话
   - 任务建议
   - 生活优化建议

### 核心组件
- **QuickCreateTaskModal**: 快速任务创建弹窗
- **QuickCreateLogModal**: 快速日志创建弹窗
- **SmartDashboard**: 智能仪表盘
- **TimeAnalysisCard**: 时间分析卡片

## 🔐 认证系统

### 用户管理
- JWT Token认证
- 自动登录/退出
- 密码加密存储

### 权限控制
- 路由守卫
- API接口保护
- 用户数据隔离

## 🗄️ 数据库设计

### 核心实体
- **User**: 用户信息
- **Task**: 任务数据
- **Log**: 日志记录
- **Project**: 项目管理
- **AnalysisQueue**: AI分析队列

### 关系设计
- 用户 ↔ 任务 (一对多)
- 用户 ↔ 日志 (一对多)
- 用户 ↔ 项目 (一对多)
- 任务 ↔ 项目 (多对一)

## 🤖 AI功能

### 任务分析
- 自动优先级评估
- 时间预估
- 任务分解建议
- 标签自动生成

### 日志分析
- 情感分析
- 生活模式识别
- 健康建议
- 趋势分析

### 智能推荐
- 任务调度优化
- 生活习惯建议
- 效率提升建议
- 个性化提醒

## 🔧 开发工具

### 前端
- **React Native**: 移动端框架
- **Expo**: 开发和构建工具
- **TypeScript**: 类型系统
- **Axios**: HTTP客户端

### 后端
- **NestJS**: Node.js框架
- **TypeORM**: ORM工具
- **PostgreSQL**: 数据库
- **Redis**: 缓存和队列
- **OpenAI**: AI服务

### 开发辅助
- **ESLint**: 代码规范
- **Prettier**: 代码格式化
- **Yarn**: 包管理
- **Docker**: 容器化

## 📊 性能优化

### 前端优化
- 懒加载和代码分割
- 图片优化
- 缓存策略
- 错误边界

### 后端优化
- 数据库索引
- 查询优化
- 缓存机制
- 异步处理

## 🚀 部署架构

### 开发环境
- 本地开发服务器
- 热重载
- 调试工具

### 生产环境
- 容器化部署
- 负载均衡
- 数据备份
- 监控告警

## 📈 产品路线图

### 已完成功能
✅ 用户认证系统
✅ 任务管理基础功能
✅ 日志系统
✅ AI分析功能
✅ 智能仪表盘
✅ 移动端应用

### 计划功能
🔄 团队协作功能
🔄 数据导入导出
🔄 高级分析报告
🔄 第三方集成
🔄 桌面端应用

## 🎨 设计系统

### 品牌标识
- **产品名称**: OmniTrack / TimeWeave
- **主色调**: 现代简约风格
- **图标系统**: SVG图标集

### 用户体验
- 直观的导航结构
- 一致的交互模式
- 响应式设计
- 无障碍支持

## 📞 技术支持

### 开发文档
- API参考文档
- 开发者指南
- 故障排查手册

### 社区支持
- GitHub Issues
- 开发者论坛
- 技术博客

---

*最后更新: 2025-07-18*
*版本: v1.0.0*