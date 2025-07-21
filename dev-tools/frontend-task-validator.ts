/**
 * 前端任务创建数据验证器
 * 用于在发送请求前验证数据格式，避免400错误
 */

export interface CreateTaskData {
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

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  cleanData: CreateTaskData;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export class TaskDataValidator {
  /**
   * 验证任务创建数据
   * @param data 原始数据
   * @returns 验证结果
   */
  static validate(data: any): ValidationResult {
    const errors: string[] = [];
    const cleanData: CreateTaskData = {};

    // 验证必填字段 - description
    const descriptionError = this.validateDescription(data.description);
    if (descriptionError) {
      errors.push(descriptionError);
    } else {
      cleanData.description = data.description.trim();
    }

    // 验证可选字段
    const completionTimeError = this.validateCompletionTime(data.completionTime);
    if (completionTimeError) {
      errors.push(completionTimeError);
    } else if (data.completionTime !== undefined) {
      cleanData.completionTime = data.completionTime;
    }

    const isRecurringError = this.validateIsRecurring(data.isRecurring);
    if (isRecurringError) {
      errors.push(isRecurringError);
    } else if (data.isRecurring !== undefined) {
      cleanData.isRecurring = data.isRecurring;
    }

    const estimatedDurationError = this.validateEstimatedDuration(data.estimatedDuration);
    if (estimatedDurationError) {
      errors.push(estimatedDurationError);
    } else if (data.estimatedDuration !== undefined) {
      cleanData.estimatedDuration = data.estimatedDuration;
    }

    const tagsError = this.validateTags(data.tags);
    if (tagsError) {
      errors.push(tagsError);
    } else if (data.tags !== undefined) {
      cleanData.tags = data.tags;
    }

    const recurrencePatternError = this.validateRecurrencePattern(data.recurrencePattern);
    if (recurrencePatternError) {
      errors.push(recurrencePatternError);
    } else if (data.recurrencePattern !== undefined) {
      cleanData.recurrencePattern = data.recurrencePattern;
    }

    // 检查无效字段
    const invalidFieldsError = this.validateInvalidFields(data);
    if (invalidFieldsError) {
      errors.push(invalidFieldsError);
    }

    return {
      isValid: errors.length === 0,
      errors,
      cleanData
    };
  }

  /**
   * 验证描述字段
   */
  private static validateDescription(description: any): string | null {
    if (description === undefined || description === null) {
      return '任务描述是必填字段';
    }
    
    if (typeof description !== 'string') {
      return '任务描述必须是字符串';
    }
    
    if (description.trim().length === 0) {
      return '任务描述不能为空';
    }
    
    if (description.length > 1000) {
      return '任务描述不能超过1000个字符';
    }
    
    return null;
  }

  /**
   * 验证完成时间字段
   */
  private static validateCompletionTime(completionTime: any): string | null {
    if (completionTime === undefined) {
      return null;
    }
    
    if (typeof completionTime !== 'string') {
      return '完成时间必须是字符串格式';
    }
    
    const date = new Date(completionTime);
    if (isNaN(date.getTime())) {
      return '完成时间格式不正确，请使用ISO 8601格式 (如: 2024-01-01T10:00:00.000Z)';
    }
    
    return null;
  }

  /**
   * 验证是否重复字段
   */
  private static validateIsRecurring(isRecurring: any): string | null {
    if (isRecurring === undefined) {
      return null;
    }
    
    if (typeof isRecurring !== 'boolean') {
      return 'isRecurring必须是布尔值 (true/false)';
    }
    
    return null;
  }

  /**
   * 验证预估时长字段
   */
  private static validateEstimatedDuration(estimatedDuration: any): string | null {
    if (estimatedDuration === undefined) {
      return null;
    }
    
    if (typeof estimatedDuration !== 'number') {
      return '预估时长必须是数字(分钟)';
    }
    
    if (estimatedDuration < 0) {
      return '预估时长必须是正数';
    }
    
    return null;
  }

  /**
   * 验证标签字段
   */
  private static validateTags(tags: any): string | null {
    if (tags === undefined) {
      return null;
    }
    
    if (!Array.isArray(tags)) {
      return '标签必须是数组';
    }
    
    if (!tags.every(tag => typeof tag === 'string')) {
      return '标签数组中的每个元素必须是字符串';
    }
    
    return null;
  }

  /**
   * 验证重复模式字段
   */
  private static validateRecurrencePattern(recurrencePattern: any): string | null {
    if (recurrencePattern === undefined) {
      return null;
    }
    
    if (typeof recurrencePattern !== 'object' || recurrencePattern === null) {
      return '重复模式必须是对象';
    }
    
    const validTypes = ['daily', 'weekly', 'monthly', 'yearly'];
    if (!recurrencePattern.type || !validTypes.includes(recurrencePattern.type)) {
      return `重复模式类型必须是: ${validTypes.join(', ')}`;
    }
    
    if (typeof recurrencePattern.interval !== 'number' || recurrencePattern.interval < 1) {
      return '重复间隔必须是正整数';
    }
    
    return null;
  }

  /**
   * 验证无效字段
   */
  private static validateInvalidFields(data: any): string | null {
    const validFields = [
      'description', 
      'completionTime', 
      'isRecurring', 
      'estimatedDuration', 
      'tags', 
      'recurrencePattern'
    ];
    
    const invalidFields = Object.keys(data).filter(key => !validFields.includes(key));
    
    if (invalidFields.length > 0) {
      return `发现无效字段: ${invalidFields.join(', ')}。请只发送后端认可的字段。`;
    }
    
    return null;
  }

  /**
   * 清理数据 - 移除无效字段并规范化数据
   */
  static cleanData(data: any): CreateTaskData {
    const validation = this.validate(data);
    return validation.cleanData;
  }

  /**
   * 快速验证 - 只返回是否有效
   */
  static isValid(data: any): boolean {
    return this.validate(data).isValid;
  }

  /**
   * 获取错误消息
   */
  static getErrors(data: any): string[] {
    return this.validate(data).errors;
  }

  /**
   * 创建标准的完成时间字符串
   */
  static createCompletionTimeString(date: Date): string {
    return date.toISOString();
  }

  /**
   * 创建示例数据
   */
  static createExampleData(): CreateTaskData {
    return {
      description: "示例任务",
      completionTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 明天
      isRecurring: false,
      estimatedDuration: 60, // 60分钟
      tags: ["示例", "测试"]
    };
  }
}

// 使用示例:
/*
import { TaskDataValidator } from './task-validator';

// 在组件中使用
const handleCreateTask = async (formData: any) => {
  const validation = TaskDataValidator.validate(formData);
  
  if (!validation.isValid) {
    // 显示错误
    validation.errors.forEach(error => {
      console.error(error);
      // 或者显示toast
    });
    return;
  }
  
  try {
    // 使用清理后的数据
    const response = await taskService.createTask(validation.cleanData);
    console.log('任务创建成功:', response);
  } catch (error) {
    console.error('任务创建失败:', error);
  }
};

// 快速验证示例
if (TaskDataValidator.isValid(formData)) {
  // 数据有效，可以发送
}

// 获取清理后的数据
const cleanData = TaskDataValidator.cleanData(formData);
*/