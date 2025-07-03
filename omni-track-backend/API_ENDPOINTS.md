# TimeWeave API 端点文档

## 基础信息
- 服务器地址: `http://localhost:3001`
- API前缀: `/api`
- 认证方式: JWT Bearer Token

## 认证相关 API

### 1. 发送验证码
```http
POST /api/auth/send-verification-code
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### 2. 用户注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "张三",
  "email": "user@example.com",
  "password": "password123",
  "verificationCode": "123456"
}
```

### 3. 用户登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### 4. 获取用户信息
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

## 项目管理 API

### 1. 创建项目
```http
POST /api/projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "我的项目",
  "description": "项目描述",
  "color": "#3b82f6",
  "icon": "folder"
}
```

### 2. 获取项目列表
```http
GET /api/projects
Authorization: Bearer <token>
```

### 3. 获取单个项目
```http
GET /api/projects/:id
Authorization: Bearer <token>
```

### 4. 更新项目
```http
PATCH /api/projects/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "更新后的项目名称",
  "description": "更新后的描述"
}
```

### 5. 删除项目
```http
DELETE /api/projects/:id
Authorization: Bearer <token>
```

### 6. 归档项目
```http
POST /api/projects/:id/archive
Authorization: Bearer <token>
```

### 7. 获取已归档项目
```http
GET /api/projects/archived
Authorization: Bearer <token>
```

## 任务管理 API

### 1. 创建任务
```http
POST /api/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "完成项目设计",
  "description": "设计项目的整体架构",
  "priority": "high",
  "dueDate": "2025-01-15T10:00:00Z",
  "estimatedDuration": 240,
  "projectId": "project-id",
  "tags": ["设计", "架构"]
}
```

### 2. 获取任务列表
```http
GET /api/tasks
Authorization: Bearer <token>
# 可选查询参数: ?projectId=xxx
```

### 3. 获取任务统计
```http
GET /api/tasks/statistics
Authorization: Bearer <token>
```

### 4. 按状态获取任务
```http
GET /api/tasks/status/:status
Authorization: Bearer <token>
# status: pending, in_progress, completed, cancelled
```

### 5. 获取逾期任务
```http
GET /api/tasks/overdue
Authorization: Bearer <token>
```

### 6. 更新任务
```http
PATCH /api/tasks/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "completed",
  "actualDuration": 180
}
```

### 7. 删除任务
```http
DELETE /api/tasks/:id
Authorization: Bearer <token>
```

### 8. 获取子任务
```http
GET /api/tasks/:id/subtasks
Authorization: Bearer <token>
```

## 日志管理 API

### 1. 创建日志条目
```http
POST /api/logs
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "work",
  "content": "今天完成了项目的初步设计，进展顺利",
  "mood": "good",
  "energy": "high",
  "location": "办公室",
  "weather": "晴天",
  "tags": ["工作", "设计"],
  "projectId": "project-id",
  "relatedTaskId": "task-id"
}
```

### 2. 获取日志列表
```http
GET /api/logs
Authorization: Bearer <token>
# 可选查询参数:
# ?type=work&projectId=xxx&startDate=2025-01-01&endDate=2025-01-31&limit=10&offset=0
```

### 3. 获取日志统计
```http
GET /api/logs/statistics
Authorization: Bearer <token>
```

### 4. 搜索日志
```http
GET /api/logs/search?q=设计
Authorization: Bearer <token>
```

### 5. 按类型获取日志
```http
GET /api/logs/type/:type
Authorization: Bearer <token>
# type: work, personal, health, learning, childcare, finance, exercise, social
```

### 6. 按标签获取日志
```http
GET /api/logs/tags?tags=工作,设计
Authorization: Bearer <token>
```

### 7. 更新日志条目
```http
PATCH /api/logs/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "更新后的日志内容",
  "mood": "very_good"
}
```

### 8. 删除日志条目
```http
DELETE /api/logs/:id
Authorization: Bearer <token>
```

## 健康检查

### 1. 服务状态
```http
GET /api/health
```

### 2. 基本信息
```http
GET /api/
```

## 响应格式

所有API响应都遵循以下格式：

### 成功响应
```json
{
  "success": true,
  "message": "操作成功",
  "data": { /* 响应数据 */ }
}
```

### 错误响应
```json
{
  "success": false,
  "message": "错误信息",
  "error": "详细错误信息"
}
```

## 状态码

- `200` - 成功
- `201` - 创建成功
- `400` - 请求参数错误
- `401` - 未授权
- `403` - 禁止访问
- `404` - 资源不存在
- `500` - 服务器内部错误