import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { LogEntry } from '../../database/entities/log-entry.entity';
import { CreateLogEntryDto, UpdateLogEntryDto, LogEntryResponseDto } from './dto/log.dto';

@Injectable()
export class LogService {
  private logEntries: LogEntry[] = []; // 临时存储，后续会替换为数据库

  async create(createLogEntryDto: CreateLogEntryDto, userId: string): Promise<LogEntryResponseDto> {
    const logEntry: LogEntry = {
      id: Date.now().toString(),
      type: createLogEntryDto.type,
      content: createLogEntryDto.content,
      metadata: createLogEntryDto.metadata,
      tags: createLogEntryDto.tags || [],
      mood: createLogEntryDto.mood,
      energy: createLogEntryDto.energy,
      location: createLogEntryDto.location,
      weather: createLogEntryDto.weather,
      userId,
      projectId: createLogEntryDto.projectId,
      relatedTaskId: createLogEntryDto.relatedTaskId,
      aiEnhanced: false,
      aiSuggestions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.logEntries.push(logEntry);
    return this.toResponseDto(logEntry);
  }

  async findAll(userId: string, options?: {
    type?: string;
    projectId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<LogEntryResponseDto[]> {
    let userLogs = this.logEntries.filter(l => l.userId === userId);
    
    // 按类型过滤
    if (options?.type) {
      userLogs = userLogs.filter(l => l.type === options.type);
    }

    // 按项目过滤
    if (options?.projectId) {
      userLogs = userLogs.filter(l => l.projectId === options.projectId);
    }

    // 按日期范围过滤
    if (options?.startDate) {
      const startDate = new Date(options.startDate);
      userLogs = userLogs.filter(l => l.createdAt >= startDate);
    }

    if (options?.endDate) {
      const endDate = new Date(options.endDate);
      userLogs = userLogs.filter(l => l.createdAt <= endDate);
    }

    // 按创建时间倒序排序
    userLogs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // 分页
    if (options?.offset) {
      userLogs = userLogs.slice(options.offset);
    }

    if (options?.limit) {
      userLogs = userLogs.slice(0, options.limit);
    }

    return userLogs.map(l => this.toResponseDto(l));
  }

  async findOne(id: string, userId: string): Promise<LogEntryResponseDto> {
    const logEntry = this.logEntries.find(l => l.id === id && l.userId === userId);
    if (!logEntry) {
      throw new NotFoundException('日志条目不存在');
    }
    return this.toResponseDto(logEntry);
  }

  async update(id: string, updateLogEntryDto: UpdateLogEntryDto, userId: string): Promise<LogEntryResponseDto> {
    const logEntryIndex = this.logEntries.findIndex(l => l.id === id);
    if (logEntryIndex === -1) {
      throw new NotFoundException('日志条目不存在');
    }

    const logEntry = this.logEntries[logEntryIndex];
    if (logEntry.userId !== userId) {
      throw new ForbiddenException('无权限修改此日志条目');
    }

    // 更新日志条目
    this.logEntries[logEntryIndex] = {
      ...logEntry,
      ...updateLogEntryDto,
      updatedAt: new Date(),
    };

    return this.toResponseDto(this.logEntries[logEntryIndex]);
  }

  async remove(id: string, userId: string): Promise<void> {
    const logEntryIndex = this.logEntries.findIndex(l => l.id === id);
    if (logEntryIndex === -1) {
      throw new NotFoundException('日志条目不存在');
    }

    const logEntry = this.logEntries[logEntryIndex];
    if (logEntry.userId !== userId) {
      throw new ForbiddenException('无权限删除此日志条目');
    }

    this.logEntries.splice(logEntryIndex, 1);
  }

  async findByType(userId: string, type: string): Promise<LogEntryResponseDto[]> {
    const userLogs = this.logEntries.filter(l => l.userId === userId && l.type === type);
    return userLogs.map(l => this.toResponseDto(l));
  }

  async findByTags(userId: string, tags: string[]): Promise<LogEntryResponseDto[]> {
    const userLogs = this.logEntries.filter(l => 
      l.userId === userId && 
      l.tags && 
      tags.some(tag => l.tags!.includes(tag))
    );
    return userLogs.map(l => this.toResponseDto(l));
  }

  async getLogStatistics(userId: string): Promise<{
    total: number;
    typeBreakdown: Record<string, number>;
    moodBreakdown: Record<string, number>;
    energyBreakdown: Record<string, number>;
    recentCount: number;
  }> {
    const userLogs = this.logEntries.filter(l => l.userId === userId);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const typeBreakdown: Record<string, number> = {};
    const moodBreakdown: Record<string, number> = {};
    const energyBreakdown: Record<string, number> = {};

    userLogs.forEach(log => {
      // 类型统计
      typeBreakdown[log.type] = (typeBreakdown[log.type] || 0) + 1;
      
      // 心情统计
      if (log.mood) {
        moodBreakdown[log.mood] = (moodBreakdown[log.mood] || 0) + 1;
      }
      
      // 精力统计
      if (log.energy) {
        energyBreakdown[log.energy] = (energyBreakdown[log.energy] || 0) + 1;
      }
    });

    return {
      total: userLogs.length,
      typeBreakdown,
      moodBreakdown,
      energyBreakdown,
      recentCount: userLogs.filter(l => l.createdAt >= sevenDaysAgo).length,
    };
  }

  async searchLogs(userId: string, query: string): Promise<LogEntryResponseDto[]> {
    const userLogs = this.logEntries.filter(l => 
      l.userId === userId && 
      (l.content.toLowerCase().includes(query.toLowerCase()) ||
       (l.tags && l.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))))
    );
    return userLogs.map(l => this.toResponseDto(l));
  }

  private toResponseDto(logEntry: LogEntry): LogEntryResponseDto {
    return {
      id: logEntry.id,
      type: logEntry.type,
      content: logEntry.content,
      metadata: logEntry.metadata,
      tags: logEntry.tags,
      mood: logEntry.mood,
      energy: logEntry.energy,
      location: logEntry.location,
      weather: logEntry.weather,
      userId: logEntry.userId,
      projectId: logEntry.projectId,
      relatedTaskId: logEntry.relatedTaskId,
      aiEnhanced: logEntry.aiEnhanced,
      aiSuggestions: logEntry.aiSuggestions,
      createdAt: logEntry.createdAt,
      updatedAt: logEntry.updatedAt,
    };
  }
}