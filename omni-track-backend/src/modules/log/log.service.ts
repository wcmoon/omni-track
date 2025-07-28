import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Log } from '../../database/entities/log.entity';
import { CreateLogEntryDto, UpdateLogEntryDto, LogEntryResponseDto } from './dto/log.dto';
import { SmartLogDto } from './dto/smart-log.dto';
import { AIService } from '../ai/ai.service';

@Injectable()
export class LogService {
  constructor(
    @InjectRepository(Log)
    private readonly logRepository: Repository<Log>,
    private readonly aiService: AIService
  ) {}

  async create(createLogEntryDto: CreateLogEntryDto, userId: string): Promise<LogEntryResponseDto> {
    const logEntry = this.logRepository.create({
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
    });

    const savedLogEntry = await this.logRepository.save(logEntry);
    return this.toResponseDto(savedLogEntry);
  }

  async findAll(userId: string, options?: {
    type?: string;
    projectId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<LogEntryResponseDto[]> {
    const query = this.logRepository.createQueryBuilder('log')
      .where('log.userId = :userId', { userId })
      .orderBy('log.createdAt', 'DESC');
    
    // 按类型过滤
    if (options?.type) {
      query.andWhere('log.type = :type', { type: options.type });
    }

    // 按项目过滤
    if (options?.projectId) {
      query.andWhere('log.projectId = :projectId', { projectId: options.projectId });
    }

    // 按时间过滤
    if (options?.startDate) {
      query.andWhere('log.createdAt >= :startDate', { startDate: new Date(options.startDate) });
    }
    
    if (options?.endDate) {
      query.andWhere('log.createdAt <= :endDate', { endDate: new Date(options.endDate) });
    }
    
    // 分页
    if (options?.offset !== undefined) {
      query.offset(options.offset);
    }
    
    if (options?.limit !== undefined) {
      query.limit(options.limit);
    }
    
    const logs = await query.getMany();
    return logs.map(l => this.toResponseDto(l));
  }

  async findOne(id: string, userId: string): Promise<LogEntryResponseDto> {
    const logEntry = await this.logRepository.findOne({
      where: { id, userId }
    });
    
    if (!logEntry) {
      throw new NotFoundException('日志条目不存在');
    }
    
    return this.toResponseDto(logEntry);
  }

  async update(id: string, updateLogEntryDto: UpdateLogEntryDto, userId: string): Promise<LogEntryResponseDto> {
    const logEntry = await this.logRepository.findOne({
      where: { id, userId }
    });
    
    if (!logEntry) {
      throw new NotFoundException('日志条目不存在');
    }

    await this.logRepository.update(id, updateLogEntryDto);
    
    const updatedLogEntry = await this.logRepository.findOne({
      where: { id, userId }
    });

    return this.toResponseDto(updatedLogEntry!);
  }

  async remove(id: string, userId: string): Promise<void> {
    const logEntry = await this.logRepository.findOne({
      where: { id, userId }
    });
    
    if (!logEntry) {
      throw new NotFoundException('日志条目不存在');
    }

    await this.logRepository.delete(id);
  }

  async findByType(userId: string, type: string): Promise<LogEntryResponseDto[]> {
    const logs = await this.logRepository.find({
      where: { userId, type },
      order: { createdAt: 'DESC' }
    });
    
    return logs.map(l => this.toResponseDto(l));
  }

  async findByDateRange(userId: string, startDate: Date, endDate: Date): Promise<LogEntryResponseDto[]> {
    const logs = await this.logRepository
      .createQueryBuilder('log')
      .where('log.userId = :userId', { userId })
      .andWhere('log.createdAt >= :startDate', { startDate })
      .andWhere('log.createdAt <= :endDate', { endDate })
      .orderBy('log.createdAt', 'DESC')
      .getMany();
      
    return logs.map(l => this.toResponseDto(l));
  }

  async getStatistics(userId: string, days: number = 30): Promise<{
    total: number;
    byType: Record<string, number>;
    byMood: Record<string, number>;
    recentCount: number;
  }> {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);
    
    const [total, recent, allLogs] = await Promise.all([
      this.logRepository.count({ where: { userId } }),
      this.logRepository
        .createQueryBuilder('log')
        .where('log.userId = :userId', { userId })
        .andWhere('log.createdAt >= :sinceDate', { sinceDate })
        .getCount(),
      this.logRepository.find({ 
        where: { userId },
        order: { createdAt: 'DESC' }
      })
    ]);
    
    const byType: Record<string, number> = {};
    const byMood: Record<string, number> = {};
    
    allLogs.forEach(log => {
      if (log.type) {
        byType[log.type] = (byType[log.type] || 0) + 1;
      }
      if (log.mood) {
        byMood[log.mood] = (byMood[log.mood] || 0) + 1;
      }
    });
    
    return {
      total,
      byType,
      byMood,
      recentCount: recent,
    };
  }

  async createSmartLog(smartLogDto: SmartLogDto, userId: string): Promise<LogEntryResponseDto> {
    // AI分析日志内容
    const analysis = await this.aiService.analyzeLogContent(smartLogDto.content);
    
    const logEntry = this.logRepository.create({
      type: analysis.suggestedType || smartLogDto.type || '日常',
      content: smartLogDto.content,
      tags: [...(smartLogDto.tags || []), ...(analysis.suggestedTags || [])],
      mood: smartLogDto.mood,
      energy: smartLogDto.energy,
      location: smartLogDto.location,
      weather: smartLogDto.weather,
      sentiment: analysis.sentiment,
      categories: analysis.keyPoints,
      userId,
      projectId: smartLogDto.projectId,
      relatedTaskId: smartLogDto.relatedTaskId,
      aiEnhanced: true,
      aiSuggestions: [{
        type: 'analysis',
        data: analysis,
        timestamp: new Date(),
      }],
    });

    const savedLogEntry = await this.logRepository.save(logEntry);
    return this.toResponseDto(savedLogEntry);
  }

  async searchLogs(userId: string, query: string): Promise<LogEntryResponseDto[]> {
    const logs = await this.logRepository
      .createQueryBuilder('log')
      .where('log.userId = :userId', { userId })
      .andWhere('(log.content ILIKE :query OR log.type ILIKE :query)', { query: `%${query}%` })
      .orderBy('log.createdAt', 'DESC')
      .getMany();
      
    return logs.map(l => this.toResponseDto(l));
  }

  async findByTags(userId: string, tags: string[]): Promise<LogEntryResponseDto[]> {
    const logs = await this.logRepository
      .createQueryBuilder('log')
      .where('log.userId = :userId', { userId })
      .andWhere('log.tags && :tags', { tags })
      .orderBy('log.createdAt', 'DESC')
      .getMany();
      
    return logs.map(l => this.toResponseDto(l));
  }

  async analyzeLogContent(content: string): Promise<any> {
    return this.aiService.analyzeLogContent(content);
  }

  async getLogTypes(userId: string): Promise<string[]> {
    const result = await this.logRepository
      .createQueryBuilder('log')
      .select('DISTINCT log.type', 'type')
      .where('log.userId = :userId', { userId })
      .andWhere('log.type IS NOT NULL')
      .getRawMany();
      
    return result.map(r => r.type).filter(Boolean);
  }

  private toResponseDto(logEntry: Log): LogEntryResponseDto {
    return {
      id: logEntry.id,
      type: logEntry.type,
      content: logEntry.content,
      metadata: logEntry.metadata,
      tags: logEntry.tags,
      mood: logEntry.mood as 'very_bad' | 'bad' | 'neutral' | 'good' | 'very_good' | undefined,
      energy: logEntry.energy as 'very_low' | 'low' | 'medium' | 'high' | 'very_high' | undefined,
      location: logEntry.location,
      weather: logEntry.weather,
      userId: logEntry.userId,
      projectId: logEntry.projectId,
      relatedTaskId: logEntry.relatedTaskId,
      aiEnhanced: logEntry.aiEnhanced,
      aiSuggestions: logEntry.aiSuggestions,
      sentiment: logEntry.sentiment,
      categories: logEntry.categories,
      createdAt: logEntry.createdAt,
      updatedAt: logEntry.updatedAt,
    };
  }
}