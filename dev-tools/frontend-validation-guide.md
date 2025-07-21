# 前端任务创建数据验证指导

## 常见400错误及解决方案

### 1. 数据类型错误

❌ **错误示例：**
```javascript
{
  description: "任务描述",
  isRecurring: "true", // 错误：字符串
  estimatedDuration: "30分钟", // 错误：字符串
  tags: "标签" // 错误：字符串
}
```

✅ **正确示例：**
```javascript
{
  description: "任务描述",
  isRecurring: true, // 正确：布尔值
  estimatedDuration: 30, // 正确：数字(分钟)
  tags: ["标签"] // 正确：字符串数组
}
```

### 2. 必填字段验证

❌ **错误示例：**
```javascript
{
  description: "", // 错误：空字符串
  tags: ["测试"]
}
```

✅ **正确示例：**
```javascript
{
  description: "至少1个字符", // 正确：非空字符串
  tags: ["测试"]
}
```

### 3. 日期格式错误

❌ **错误示例：**
```javascript
{
  description: "任务描述",
  completionTime: "2024-01-01", // 错误：不完整的日期
}
```

✅ **正确示例：**
```javascript
{
  description: "任务描述",
  completionTime: "2024-01-01T10:00:00.000Z", // 正确：ISO 8601格式
}
```

### 4. 无效字段错误

❌ **错误示例：**
```javascript
{
  description: "任务描述",
  extraField: "不应该存在", // 错误：无效字段
  invalidProperty: "test" // 错误：无效字段
}
```

✅ **正确示例：**
```javascript
{
  description: "任务描述",
  // 只包含后端认可的字段
  tags: ["测试"]
}
```

## 前端验证函数

### TypeScript 接口定义

```typescript
interface CreateTaskData {
  description: string;
  completionTime?: string;
  isRecurring?: boolean;
  estimatedDuration?: number;
  tags?: string[];
  recurrencePattern?: {
    type: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    daysOfWeek?: number[];
    dayOfMonth?: number;
    endDate?: Date;
    occurrences?: number;
  };
}
```

### 数据验证函数

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  cleanData: CreateTaskData;
}

export function validateTaskData(data: any): ValidationResult {
  const errors: string[] = [];
  const cleanData: CreateTaskData = {};

  // 验证必填字段 - description
  if (!data.description || typeof data.description !== 'string') {
    errors.push('任务描述是必填字段');
  } else if (data.description.trim().length === 0) {
    errors.push('任务描述不能为空');
  } else if (data.description.length > 1000) {
    errors.push('任务描述不能超过1000个字符');
  } else {
    cleanData.description = data.description.trim();
  }

  // 验证可选字段 - completionTime
  if (data.completionTime !== undefined) {
    if (typeof data.completionTime !== 'string') {
      errors.push('完成时间必须是字符串格式');
    } else {
      const date = new Date(data.completionTime);
      if (isNaN(date.getTime())) {
        errors.push('完成时间格式不正确，请使用ISO 8601格式');
      } else {
        cleanData.completionTime = data.completionTime;
      }
    }
  }

  // 验证可选字段 - isRecurring
  if (data.isRecurring !== undefined) {
    if (typeof data.isRecurring !== 'boolean') {
      errors.push('isRecurring必须是布尔值');
    } else {
      cleanData.isRecurring = data.isRecurring;
    }
  }

  // 验证可选字段 - estimatedDuration
  if (data.estimatedDuration !== undefined) {
    if (typeof data.estimatedDuration !== 'number' || data.estimatedDuration < 0) {
      errors.push('预估时长必须是正数(分钟)');
    } else {
      cleanData.estimatedDuration = data.estimatedDuration;
    }
  }

  // 验证可选字段 - tags
  if (data.tags !== undefined) {
    if (!Array.isArray(data.tags)) {
      errors.push('标签必须是数组');
    } else if (!data.tags.every(tag => typeof tag === 'string')) {
      errors.push('标签数组中的每个元素必须是字符串');
    } else {
      cleanData.tags = data.tags;
    }
  }

  // 验证可选字段 - recurrencePattern
  if (data.recurrencePattern !== undefined) {
    if (typeof data.recurrencePattern !== 'object') {
      errors.push('重复模式必须是对象');
    } else {
      // 简单验证重复模式对象
      const pattern = data.recurrencePattern;
      if (!pattern.type || !['daily', 'weekly', 'monthly', 'yearly'].includes(pattern.type)) {
        errors.push('重复模式类型必须是daily、weekly、monthly或yearly');
      } else if (typeof pattern.interval !== 'number' || pattern.interval < 1) {
        errors.push('重复间隔必须是正整数');
      } else {
        cleanData.recurrencePattern = pattern;
      }
    }
  }

  // 检查无效字段
  const validFields = ['description', 'completionTime', 'isRecurring', 'estimatedDuration', 'tags', 'recurrencePattern'];
  const invalidFields = Object.keys(data).filter(key => !validFields.includes(key));
  if (invalidFields.length > 0) {
    errors.push(`无效字段: ${invalidFields.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    cleanData
  };
}
```

### 使用示例

```typescript
// 在React组件中使用
const handleCreateTask = async (formData: any) => {
  const validation = validateTaskData(formData);
  
  if (!validation.isValid) {
    // 显示验证错误
    validation.errors.forEach(error => {
      console.error(error);
      // 或者显示toast错误消息
    });
    return;
  }
  
  try {
    // 使用清理后的数据发送请求
    const response = await taskService.createTask(validation.cleanData);
    console.log('任务创建成功:', response);
  } catch (error) {
    console.error('任务创建失败:', error);
  }
};
```

## 快速修复清单

1. **检查数据类型**
   - isRecurring: 确保是 boolean，不是字符串
   - estimatedDuration: 确保是 number，不是字符串
   - tags: 确保是 string[]，不是单个字符串

2. **检查必填字段**
   - description: 确保非空且长度在1-1000字符之间

3. **检查日期格式**
   - completionTime: 使用 new Date().toISOString() 格式

4. **移除无效字段**
   - 只发送后端认可的字段

5. **添加前端验证**
   - 在发送请求前使用上述验证函数

## 调试建议

如果仍然遇到400错误：

1. 在发送请求前打印数据:
   ```javascript
   console.log('发送的数据:', JSON.stringify(taskData, null, 2));
   ```

2. 检查后端错误消息的详细信息

3. 使用浏览器开发者工具检查网络请求的实际数据

通过遵循这些指导，应该能够解决所有400错误问题。