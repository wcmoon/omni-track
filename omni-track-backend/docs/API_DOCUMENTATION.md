# OmniTrack Backend API Documentation

## Table of Contents
- [Authentication](#authentication)
- [Tasks](#tasks)
- [Logs](#logs)
- [Projects](#projects)
- [Smart Todo](#smart-todo)
- [AI Services](#ai-services)

## Base URL
```
http://localhost:3000
```

## Authentication
Most endpoints require JWT authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Authentication

### 1. Send Verification Code
Send a verification code to the user's email for registration.

**Endpoint:** `POST /auth/send-verification-code`  
**Authentication:** None  
**Request Body:**
```json
{
  "email": "user@example.com"
}
```
**Response:**
```json
{
  "success": true,
  "message": "验证码已发送",
  "data": {
    "email": "user@example.com"
  }
}
```

### 2. Verify Code
Verify the email verification code.

**Endpoint:** `POST /auth/verify-code`  
**Authentication:** None  
**Request Body:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```
**Response:**
```json
{
  "success": true,
  "message": "验证码验证成功",
  "isValid": true
}
```

### 3. Register
Register a new user account.

**Endpoint:** `POST /auth/register`  
**Authentication:** None  
**Request Body:**
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123",
  "verificationCode": "123456"
}
```
**Validation Rules:**
- `name`: 2-50 characters
- `email`: Valid email format
- `password`: Minimum 6 characters, maximum 128 characters
- `verificationCode`: Exactly 6 characters

**Response:**
```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "id": "1234567890",
    "email": "user@example.com",
    "name": "John Doe",
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 4. Login
Login with email and password.

**Endpoint:** `POST /auth/login`  
**Authentication:** None  
**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
**Validation Rules:**
- `email`: Valid email format
- `password`: Minimum 6 characters

**Response:**
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "id": "1234567890",
    "email": "user@example.com",
    "name": "John Doe",
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 5. Get Profile
Get the current user's profile information.

**Endpoint:** `GET /auth/profile`  
**Authentication:** Required (JWT)  
**Response:**
```json
{
  "success": true,
  "data": {
    "id": "1234567890",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### 6. Logout
Logout the current user.

**Endpoint:** `POST /auth/logout`  
**Authentication:** None  
**Response:**
```json
{
  "success": true,
  "message": "退出登录成功"
}
```

### 7. Quick Register (Development Only)
Quick registration without verification code for development purposes.

**Endpoint:** `POST /auth/quick-register`  
**Authentication:** None  
**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```
**Response:**
```json
{
  "success": true,
  "message": "快速注册成功",
  "data": {
    "id": "1234567890",
    "email": "user@example.com",
    "name": "John Doe",
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## Tasks

### 1. Create Task
Create a new task.

**Endpoint:** `POST /tasks`  
**Authentication:** Required (JWT)  
**Request Body:**
```json
{
  "description": "Complete project documentation",
  "completionTime": "2024-12-31T23:59:59Z",
  "isRecurring": false,
  "recurrencePattern": {
    "type": "weekly",
    "interval": 1,
    "daysOfWeek": [1, 3, 5],
    "endDate": "2025-12-31T23:59:59Z"
  },
  "estimatedDuration": 120,
  "tags": ["work", "documentation"]
}
```
**Validation Rules:**
- `description`: Required, 1-1000 characters
- `completionTime`: Optional, ISO date string
- `isRecurring`: Optional, boolean
- `recurrencePattern`: Optional, required if isRecurring is true
- `estimatedDuration`: Optional, number (minutes)
- `tags`: Optional, array of strings

**Response:**
```json
{
  "success": true,
  "message": "任务创建成功",
  "data": {
    "id": "task123",
    "description": "Complete project documentation",
    "status": "pending",
    "completionTime": "2024-12-31T23:59:59Z",
    "isRecurring": false,
    "estimatedDuration": 120,
    "tags": ["work", "documentation"],
    "userId": "1234567890",
    "aiGenerated": false,
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

### 2. Get All Tasks
Get all tasks for the current user.

**Endpoint:** `GET /tasks`  
**Authentication:** Required (JWT)  
**Query Parameters:**
- `projectId` (optional): Filter by project ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "task123",
      "description": "Complete project documentation",
      "status": "pending",
      "completionTime": "2024-12-31T23:59:59Z",
      "tags": ["work", "documentation"],
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### 3. Get Task by ID
Get a specific task by ID.

**Endpoint:** `GET /tasks/:id`  
**Authentication:** Required (JWT)  
**Response:**
```json
{
  "success": true,
  "data": {
    "id": "task123",
    "description": "Complete project documentation",
    "status": "pending",
    "completionTime": "2024-12-31T23:59:59Z",
    "tags": ["work", "documentation"],
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

### 4. Update Task
Update an existing task.

**Endpoint:** `PATCH /tasks/:id`  
**Authentication:** Required (JWT)  
**Request Body:**
```json
{
  "description": "Updated task description",
  "status": "in_progress",
  "completionTime": "2024-12-31T23:59:59Z",
  "tags": ["work", "updated"]
}
```
**Validation Rules:**
- All fields are optional
- `status`: Must be "pending", "in_progress", or "completed"

**Response:**
```json
{
  "success": true,
  "message": "任务更新成功",
  "data": {
    "id": "task123",
    "description": "Updated task description",
    "status": "in_progress",
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

### 5. Delete Task
Delete a task.

**Endpoint:** `DELETE /tasks/:id`  
**Authentication:** Required (JWT)  
**Response:**
```json
{
  "success": true,
  "message": "任务删除成功"
}
```

### 6. Get Task Statistics
Get statistics about user's tasks.

**Endpoint:** `GET /tasks/statistics`  
**Authentication:** Required (JWT)  
**Response:**
```json
{
  "success": true,
  "data": {
    "total": 50,
    "pending": 20,
    "in_progress": 10,
    "completed": 20,
    "overdue": 5
  }
}
```

### 7. Get Tasks by Status
Get tasks filtered by status.

**Endpoint:** `GET /tasks/status/:status`  
**Authentication:** Required (JWT)  
**Parameters:**
- `status`: "pending", "in_progress", or "completed"

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "task123",
      "description": "Task description",
      "status": "pending",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### 8. Get Overdue Tasks
Get all overdue tasks.

**Endpoint:** `GET /tasks/overdue`  
**Authentication:** Required (JWT)  
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "task123",
      "description": "Overdue task",
      "completionTime": "2024-01-01T23:59:59Z",
      "status": "pending"
    }
  ]
}
```

### 9. Smart Create Task
Create a task with AI-powered enhancements.

**Endpoint:** `POST /tasks/smart-create`  
**Authentication:** Required (JWT)  
**Request Body:**
```json
{
  "description": "Write blog post about AI",
  "useSmartSuggestions": true,
  "autoBreakdown": true
}
```
**Response:**
```json
{
  "success": true,
  "message": "智能任务创建成功",
  "data": {
    "task": {
      "id": "task123",
      "description": "Write blog post about AI",
      "estimatedDuration": 180,
      "tags": ["writing", "AI", "blog"],
      "aiGenerated": true
    },
    "subtasks": [
      {
        "description": "Research AI topics",
        "estimatedDuration": 60
      },
      {
        "description": "Write draft",
        "estimatedDuration": 90
      }
    ]
  }
}
```

### 10. Batch Create Tasks
Create multiple tasks at once.

**Endpoint:** `POST /tasks/batch-create`  
**Authentication:** Required (JWT)  
**Request Body:**
```json
{
  "tasks": [
    {
      "description": "Task 1",
      "tags": ["work"]
    },
    {
      "description": "Task 2",
      "tags": ["personal"]
    }
  ],
  "projectId": "project123",
  "useSmartSuggestions": true
}
```
**Response:**
```json
{
  "success": true,
  "message": "批量创建 2 个任务成功",
  "data": {
    "created": [
      {
        "id": "task1",
        "description": "Task 1"
      },
      {
        "id": "task2",
        "description": "Task 2"
      }
    ]
  }
}
```

### 11. Analyze Task
Analyze a task description using AI.

**Endpoint:** `POST /tasks/analyze`  
**Authentication:** Required (JWT)  
**Request Body:**
```json
{
  "description": "Meet with team tomorrow at 2pm to discuss Q1 goals"
}
```
**Response:**
```json
{
  "success": true,
  "message": "任务分析完成",
  "data": {
    "suggestedTags": ["meeting", "team", "planning"],
    "estimatedDuration": 60,
    "timeAnalysis": {
      "hasTimeConstraints": true,
      "isUrgent": true,
      "suggestedCompletionTime": "2024-01-16T14:00:00Z",
      "timeKeywords": ["tomorrow", "2pm"],
      "isRecurring": false
    }
  }
}
```

---

## Logs

### 1. Create Log Entry
Create a new log entry.

**Endpoint:** `POST /logs`  
**Authentication:** Required (JWT)  
**Request Body:**
```json
{
  "type": "work",
  "content": "Completed the API documentation",
  "metadata": {
    "duration": 120,
    "project": "OmniTrack"
  },
  "tags": ["documentation", "api"],
  "mood": "good",
  "energy": "high",
  "location": "Home Office",
  "weather": "Sunny",
  "projectId": "project123",
  "relatedTaskId": "task123"
}
```
**Validation Rules:**
- `content`: Required, 1-5000 characters
- `type`: Optional, string
- `mood`: Optional, must be "very_bad", "bad", "neutral", "good", or "very_good"
- `energy`: Optional, must be "very_low", "low", "medium", "high", or "very_high"
- `location`: Optional, max 200 characters
- `weather`: Optional, max 100 characters

**Response:**
```json
{
  "success": true,
  "message": "日志条目创建成功",
  "data": {
    "id": "log123",
    "type": "work",
    "content": "Completed the API documentation",
    "tags": ["documentation", "api"],
    "mood": "good",
    "energy": "high",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

### 2. Smart Create Log Entry
Create a log entry with AI-powered tag suggestions.

**Endpoint:** `POST /logs/smart-create`  
**Authentication:** Required (JWT)  
**Request Body:** Same as Create Log Entry  
**Response:**
```json
{
  "success": true,
  "message": "智能日志条目创建成功",
  "data": {
    "logEntry": {
      "id": "log123",
      "content": "Completed the API documentation",
      "tags": ["documentation", "api", "productivity", "achievement"]
    },
    "suggestions": {
      "suggestedTags": ["productivity", "achievement", "milestone"],
      "reasoning": "The content indicates task completion and achievement",
      "confidence": 0.85
    }
  }
}
```

### 3. Get All Logs
Get all log entries with optional filters.

**Endpoint:** `GET /logs`  
**Authentication:** Required (JWT)  
**Query Parameters:**
- `type` (optional): Filter by log type
- `projectId` (optional): Filter by project ID
- `startDate` (optional): Start date for filtering (ISO string)
- `endDate` (optional): End date for filtering (ISO string)
- `limit` (optional): Number of results to return
- `offset` (optional): Number of results to skip

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "log123",
      "type": "work",
      "content": "Completed the API documentation",
      "tags": ["documentation", "api"],
      "mood": "good",
      "energy": "high",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### 4. Get Log by ID
Get a specific log entry.

**Endpoint:** `GET /logs/:id`  
**Authentication:** Required (JWT)  
**Response:**
```json
{
  "success": true,
  "data": {
    "id": "log123",
    "type": "work",
    "content": "Completed the API documentation",
    "tags": ["documentation", "api"],
    "mood": "good",
    "energy": "high",
    "metadata": {
      "duration": 120,
      "project": "OmniTrack"
    },
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

### 5. Update Log Entry
Update an existing log entry.

**Endpoint:** `PATCH /logs/:id`  
**Authentication:** Required (JWT)  
**Request Body:**
```json
{
  "content": "Updated log content",
  "tags": ["updated", "documentation"],
  "mood": "very_good"
}
```
**Response:**
```json
{
  "success": true,
  "message": "日志条目更新成功",
  "data": {
    "id": "log123",
    "content": "Updated log content",
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

### 6. Delete Log Entry
Delete a log entry.

**Endpoint:** `DELETE /logs/:id`  
**Authentication:** Required (JWT)  
**Response:**
```json
{
  "success": true,
  "message": "日志条目删除成功"
}
```

### 7. Get Log Statistics
Get statistics about user's logs.

**Endpoint:** `GET /logs/statistics`  
**Authentication:** Required (JWT)  
**Response:**
```json
{
  "success": true,
  "data": {
    "totalEntries": 150,
    "byType": {
      "work": 80,
      "personal": 40,
      "health": 30
    },
    "averageMood": 3.5,
    "averageEnergy": 3.2,
    "mostUsedTags": ["work", "productivity", "health"]
  }
}
```

### 8. Search Logs
Search logs by content.

**Endpoint:** `GET /logs/search`  
**Authentication:** Required (JWT)  
**Query Parameters:**
- `q` (required): Search query

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "log123",
      "content": "Content containing search query",
      "type": "work",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### 9. Get Logs by Type
Get logs filtered by type.

**Endpoint:** `GET /logs/type/:type`  
**Authentication:** Required (JWT)  
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "log123",
      "type": "work",
      "content": "Work-related log",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### 10. Get Logs by Tags
Get logs filtered by tags.

**Endpoint:** `GET /logs/tags`  
**Authentication:** Required (JWT)  
**Query Parameters:**
- `tags` (required): Comma-separated list of tags

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "log123",
      "content": "Log with specified tags",
      "tags": ["work", "productivity"],
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### 11. Analyze Log Content
Analyze log content using AI.

**Endpoint:** `POST /logs/analyze`  
**Authentication:** Required (JWT)  
**Request Body:**
```json
{
  "content": "Had a productive day. Completed 3 major tasks and exercised for 30 minutes."
}
```
**Response:**
```json
{
  "success": true,
  "message": "日志分析完成",
  "data": {
    "sentiment": "positive",
    "suggestedTags": ["productivity", "achievement", "exercise", "health"],
    "keyTopics": ["task completion", "physical activity"],
    "moodIndicator": "good",
    "energyIndicator": "high"
  }
}
```

### 12. Create Smart Log
Create a log with full AI analysis.

**Endpoint:** `POST /logs/smart-log`  
**Authentication:** Required (JWT)  
**Request Body:**
```json
{
  "content": "Finished the quarterly report. Feeling accomplished but tired.",
  "type": "work",
  "tags": ["report", "q4"]
}
```
**Response:**
```json
{
  "success": true,
  "message": "智能日志创建成功",
  "data": {
    "id": "log123",
    "content": "Finished the quarterly report. Feeling accomplished but tired.",
    "type": "work",
    "tags": ["report", "q4", "achievement", "milestone"],
    "mood": "good",
    "energy": "low",
    "aiEnhanced": true,
    "aiSuggestions": ["Consider taking a break", "Celebrate the achievement"]
  }
}
```

### 13. Get Log Types
Get all available log types used by the user.

**Endpoint:** `GET /logs/types`  
**Authentication:** Required (JWT)  
**Response:**
```json
{
  "success": true,
  "data": [
    "work",
    "personal",
    "health",
    "learning",
    "childcare",
    "finance",
    "exercise",
    "social"
  ]
}
```

---

## Projects

### 1. Create Project
Create a new project.

**Endpoint:** `POST /projects`  
**Authentication:** Required (JWT)  
**Request Body:**
```json
{
  "name": "OmniTrack Development",
  "description": "Main project for OmniTrack app development",
  "color": "#3B82F6",
  "icon": "code"
}
```
**Validation Rules:**
- `name`: Required, 1-100 characters
- `description`: Optional, max 500 characters
- `color`: Optional, hex color string
- `icon`: Optional, icon identifier

**Response:**
```json
{
  "success": true,
  "message": "项目创建成功",
  "data": {
    "id": "project123",
    "name": "OmniTrack Development",
    "description": "Main project for OmniTrack app development",
    "color": "#3B82F6",
    "icon": "code",
    "userId": "1234567890",
    "isArchived": false,
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

### 2. Get All Projects
Get all projects for the current user.

**Endpoint:** `GET /projects`  
**Authentication:** Required (JWT)  
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "project123",
      "name": "OmniTrack Development",
      "description": "Main project for OmniTrack app development",
      "color": "#3B82F6",
      "icon": "code",
      "isArchived": false,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### 3. Get Project by ID
Get a specific project.

**Endpoint:** `GET /projects/:id`  
**Authentication:** Required (JWT)  
**Response:**
```json
{
  "success": true,
  "data": {
    "id": "project123",
    "name": "OmniTrack Development",
    "description": "Main project for OmniTrack app development",
    "color": "#3B82F6",
    "icon": "code",
    "isArchived": false,
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

### 4. Update Project
Update an existing project.

**Endpoint:** `PATCH /projects/:id`  
**Authentication:** Required (JWT)  
**Request Body:**
```json
{
  "name": "Updated Project Name",
  "description": "Updated description",
  "color": "#10B981",
  "isArchived": false
}
```
**Response:**
```json
{
  "success": true,
  "message": "项目更新成功",
  "data": {
    "id": "project123",
    "name": "Updated Project Name",
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

### 5. Delete Project
Delete a project.

**Endpoint:** `DELETE /projects/:id`  
**Authentication:** Required (JWT)  
**Response:**
```json
{
  "success": true,
  "message": "项目删除成功"
}
```

### 6. Archive Project
Archive a project.

**Endpoint:** `POST /projects/:id/archive`  
**Authentication:** Required (JWT)  
**Response:**
```json
{
  "success": true,
  "message": "项目已归档",
  "data": {
    "id": "project123",
    "isArchived": true,
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

### 7. Unarchive Project
Unarchive a project.

**Endpoint:** `POST /projects/:id/unarchive`  
**Authentication:** Required (JWT)  
**Response:**
```json
{
  "success": true,
  "message": "项目已取消归档",
  "data": {
    "id": "project123",
    "isArchived": false,
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

### 8. Get Archived Projects
Get all archived projects.

**Endpoint:** `GET /projects/archived`  
**Authentication:** Required (JWT)  
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "project456",
      "name": "Archived Project",
      "isArchived": true,
      "archivedAt": "2024-01-10T10:00:00Z"
    }
  ]
}
```

---

## Smart Todo

### 1. Analyze Task
Analyze a task using AI to get priority and time suggestions.

**Endpoint:** `POST /smart-todo/analyze`  
**Authentication:** Required (JWT)  
**Request Body:**
```json
{
  "title": "Prepare presentation for client meeting",
  "description": "Create slides and demo for next week's client presentation",
  "dueDate": "2024-01-22T14:00:00Z"
}
```
**Validation Rules:**
- `title`: Required, 1-200 characters
- `description`: Optional, max 1000 characters
- `dueDate`: Optional, ISO date string

**Response:**
```json
{
  "success": true,
  "message": "任务分析完成",
  "data": {
    "suggestedPriority": "high",
    "reasoning": "Client meeting is time-sensitive and business-critical",
    "estimatedDuration": 240,
    "subtasks": [
      "Research client requirements",
      "Create presentation outline",
      "Design slides",
      "Prepare demo environment",
      "Practice presentation"
    ],
    "tags": ["presentation", "client", "meeting", "urgent"]
  }
}
```

### 2. Breakdown Task
Break down a complex task into subtasks.

**Endpoint:** `POST /smart-todo/breakdown`  
**Authentication:** Required (JWT)  
**Request Body:**
```json
{
  "title": "Launch new product feature",
  "description": "Complete development and launch of user dashboard feature"
}
```
**Response:**
```json
{
  "success": true,
  "message": "任务分解完成",
  "data": {
    "subtasks": [
      {
        "title": "Design UI mockups",
        "description": "Create wireframes and high-fidelity designs",
        "estimatedDuration": 180,
        "priority": "high"
      },
      {
        "title": "Implement backend API",
        "description": "Build REST endpoints for dashboard data",
        "estimatedDuration": 360,
        "priority": "high"
      },
      {
        "title": "Develop frontend components",
        "description": "Build React components for dashboard",
        "estimatedDuration": 480,
        "priority": "high"
      },
      {
        "title": "Write tests",
        "description": "Unit and integration tests",
        "estimatedDuration": 240,
        "priority": "medium"
      },
      {
        "title": "Deploy to production",
        "description": "Release and monitor",
        "estimatedDuration": 120,
        "priority": "high"
      }
    ],
    "reasoning": "Task broken down into logical development phases"
  }
}
```

### 3. Get Smart Reminders
Get AI-generated reminders based on tasks and patterns.

**Endpoint:** `GET /smart-todo/reminders`  
**Authentication:** Required (JWT)  
**Response:**
```json
{
  "success": true,
  "message": "智能提醒获取成功",
  "data": [
    {
      "taskId": "task123",
      "title": "Client presentation",
      "reminderType": "due_soon",
      "message": "Client presentation is due in 2 days. Consider starting preparation.",
      "priority": "high"
    },
    {
      "taskId": "task456",
      "title": "Code review",
      "reminderType": "suggested_start",
      "message": "Based on your patterns, mornings are your most productive time for code reviews.",
      "priority": "medium"
    }
  ]
}
```

### 4. Get Workflow Suggestions
Get AI-powered workflow optimization suggestions.

**Endpoint:** `GET /smart-todo/workflow-suggestions`  
**Authentication:** Required (JWT)  
**Response:**
```json
{
  "success": true,
  "message": "工作流程建议获取成功",
  "data": {
    "recommendedTasks": [
      {
        "taskId": "task789",
        "title": "Email responses",
        "reason": "You typically handle emails efficiently in the morning",
        "estimatedDuration": 30
      },
      {
        "taskId": "task101",
        "title": "Code implementation",
        "reason": "Your focus peaks mid-morning, ideal for complex coding",
        "estimatedDuration": 120
      }
    ],
    "workflowTips": [
      "Consider batching similar tasks together for better efficiency",
      "Your productivity data suggests taking a 15-minute break every 90 minutes"
    ]
  }
}
```

### 5. Get Smart Dashboard
Get comprehensive dashboard data with AI insights.

**Endpoint:** `GET /smart-todo/dashboard`  
**Authentication:** Required (JWT)  
**Response:**
```json
{
  "success": true,
  "message": "智能仪表盘数据获取成功",
  "data": {
    "reminders": [
      {
        "taskId": "task123",
        "title": "Urgent: Client deadline",
        "reminderType": "overdue",
        "message": "This task is overdue by 2 hours",
        "priority": "high"
      }
    ],
    "recommendedTasks": [
      {
        "taskId": "task456",
        "title": "Morning code review",
        "reason": "Optimal time based on your patterns",
        "estimatedDuration": 45
      }
    ],
    "workflowTips": [
      "You've been highly productive this week!",
      "Consider scheduling deep work blocks"
    ],
    "summary": {
      "totalReminders": 5,
      "urgentReminders": 2,
      "recommendedTasksCount": 8
    }
  }
}
```

---

## AI Services

### 1. Analyze Text
Analyze any text using AI for insights and suggestions.

**Endpoint:** `POST /ai/analyze`  
**Authentication:** Required (JWT)  
**Request Body:**
```json
{
  "text": "I need to improve our team's productivity and communication"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "sentiment": "neutral",
    "intent": "improvement",
    "keywords": ["productivity", "communication", "team"],
    "suggestions": [
      "Consider implementing daily standup meetings",
      "Use project management tools for better visibility",
      "Schedule regular one-on-ones with team members"
    ],
    "category": "management"
  }
}
```

### 2. Enhance Content
Enhance and improve text content using AI.

**Endpoint:** `POST /ai/enhance`  
**Authentication:** Required (JWT)  
**Request Body:**
```json
{
  "text": "meeting notes: discussed project timeline, need to finish by end of month",
  "context": "Professional meeting summary"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "enhanced": "Meeting Summary: The team discussed the project timeline with a focus on meeting the end-of-month deadline. Key action items and deliverables were identified to ensure timely completion.",
    "improvements": [
      "Added professional structure",
      "Clarified the message",
      "Enhanced readability"
    ]
  }
}
```

### 3. Ask Question
Ask AI questions about your data or general queries.

**Endpoint:** `POST /ai/ask`  
**Authentication:** Required (JWT)  
**Request Body:**
```json
{
  "question": "What are my most productive hours based on my task completion patterns?",
  "context": "productivity analysis"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "question": "What are my most productive hours based on my task completion patterns?",
    "answer": "Based on your task completion data, your most productive hours are between 9 AM and 12 PM, with a secondary peak from 2 PM to 4 PM. You complete 65% of your high-priority tasks during these time windows."
  }
}
```

---

## Error Responses

All endpoints may return error responses in the following format:

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "请输入有效的邮箱地址"
    }
  ]
}
```

### Authentication Error (401)
```json
{
  "success": false,
  "message": "Unauthorized",
  "error": "Invalid or expired token"
}
```

### Not Found Error (404)
```json
{
  "success": false,
  "message": "Resource not found",
  "error": "Task with ID task123 not found"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "An unexpected error occurred"
}
```

---

## Rate Limiting

API requests are rate-limited to prevent abuse:
- **Authenticated requests**: 1000 requests per hour per user
- **Unauthenticated requests**: 100 requests per hour per IP

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642329600
```

---

## Webhooks

Webhooks can be configured to receive real-time notifications for certain events:
- Task created/updated/deleted
- Log entry created
- Project status changes

Contact support to configure webhooks for your account.

---

## SDK and Client Libraries

Official SDKs are available for:
- JavaScript/TypeScript
- Python
- Go
- Ruby

See the [SDK documentation](https://github.com/omnitrack/sdks) for installation and usage instructions.