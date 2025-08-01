# 错误处理指南

## 概述

本项目已经实现了完整的401错误处理机制，确保当用户的认证token过期时，应用能够自动退出登录并跳转到登录页面。

## 实现的功能

### 1. 自动401错误处理
- 当API返回401错误时，自动清除用户的认证信息
- 显示友好的错误提示信息
- 自动退出登录状态，跳转到登录页面

### 2. 全局错误处理
- 统一的错误分类和处理
- 网络错误、服务器错误等的统一处理
- 用户友好的错误消息显示

### 3. Toast提示机制
- 自动显示错误信息给用户
- 不同类型的错误使用不同的提示样式

## 文件结构

```
src/
├── services/
│   ├── api.ts                 # API服务和拦截器
│   ├── authService.ts         # 认证服务
│   ├── navigationService.ts   # 导航服务
│   └── errorHandler.ts        # 错误处理服务
├── context/
│   └── AuthContext.tsx        # 认证上下文
├── components/common/
│   └── ToastProvider.tsx      # Toast组件
├── hooks/
│   └── useApiError.ts         # API错误处理钩子
├── utils/
│   └── apiHelper.ts           # API帮助工具
└── navigation/
    └── AppNavigator.tsx       # 主导航器
```

## 使用方法

### 1. 在组件中使用API
```typescript
import { useApiError } from '../hooks/useApiError';
import { apiHelper } from '../utils/apiHelper';

function MyComponent() {
  const { handleError } = useApiError();

  const fetchData = async () => {
    try {
      const data = await apiHelper.get('/api/data');
      // 处理成功响应
    } catch (error) {
      // 错误会被自动处理，如果是401错误会自动登出
      handleError(error, 'Fetch Data');
    }
  };

  return (
    // 组件内容
  );
}
```

### 2. 手动触发登出
```typescript
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { logout, forceLogout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout(); // 正常登出，会调用API
    } catch (error) {
      await forceLogout(); // 强制登出，不调用API
    }
  };

  return (
    // 组件内容
  );
}
```

### 3. 显示错误提示
```typescript
import { useToast } from '../components/common/ToastProvider';

function MyComponent() {
  const { showToast } = useToast();

  const handleError = () => {
    showToast('操作失败', 'error');
  };

  return (
    // 组件内容
  );
}
```

## 错误类型

系统支持以下错误类型：

- `AUTHENTICATION_ERROR` (401): 认证错误，自动登出
- `AUTHORIZATION_ERROR` (403): 权限错误
- `VALIDATION_ERROR` (422): 验证错误
- `SERVER_ERROR` (500): 服务器错误
- `NETWORK_ERROR`: 网络连接错误
- `UNKNOWN_ERROR`: 未知错误

## 注意事项

1. **循环依赖**: 使用全局引用避免了循环依赖问题
2. **错误分类**: 不同类型的错误有不同的处理策略
3. **用户体验**: 自动处理常见错误，减少用户操作
4. **调试**: 所有错误都会被记录到控制台，便于调试

## 测试

可以通过以下方式测试401错误处理：

1. 登录后手动删除token
2. 使用过期的token进行API调用
3. 观察应用是否自动退出登录并显示错误提示