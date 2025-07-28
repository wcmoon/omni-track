import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { LogService } from './log.service';
import { SmartLogService } from './smart-log.service';
import { CreateLogEntryDto, UpdateLogEntryDto } from './dto/log.dto';
import { SmartLogDto, AnalyzeLogDto } from './dto/smart-log.dto';

@Controller('logs')
@UseGuards(JwtAuthGuard)
export class LogController {
  constructor(
    private readonly logService: LogService,
    private readonly smartLogService: SmartLogService,
  ) {}

  @Post()
  async create(@Body() createLogEntryDto: CreateLogEntryDto, @Request() req) {
    const userId = req.user.id;
    const result = await this.logService.create(createLogEntryDto, userId);
    return {
      success: true,
      message: '日志条目创建成功',
      data: result,
    };
  }

  @Post('smart-create')
  async smartCreate(@Body() createLogEntryDto: CreateLogEntryDto, @Request() req) {
    // 获取智能标签建议
    const tagSuggestions = await this.smartLogService.suggestTags(
      createLogEntryDto.content,
      createLogEntryDto.type
    );

    // 合并建议的标签
    const enhancedDto = {
      ...createLogEntryDto,
      tags: [
        ...(createLogEntryDto.tags || []),
        ...tagSuggestions.suggestedTags.slice(0, 3), // 添加前3个建议标签
      ],
    };

    const userId = req.user.id;
    const result = await this.logService.create(enhancedDto, userId);
    
    return {
      success: true,
      message: '智能日志条目创建成功',
      data: {
        logEntry: result,
        suggestions: tagSuggestions,
      },
    };
  }

  @Get()
  async findAll(
    @Request() req,
    @Query('type') type?: string,
    @Query('projectId') projectId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const options = {
      type,
      projectId,
      startDate,
      endDate,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    };

    const userId = req.user.id;
    const result = await this.logService.findAll(userId, options);
    return {
      success: true,
      data: result,
    };
  }

  @Get('statistics')
  async getStatistics(@Request() req) {
    const userId = req.user.id;
    const result = await this.logService.getStatistics(userId);
    return {
      success: true,
      data: result,
    };
  }

  @Get('search')
  async searchLogs(@Request() req, @Query('q') query: string) {
    if (!query) {
      return {
        success: false,
        message: '搜索查询不能为空',
        data: [],
      };
    }

    const userId = req.user.id;
    const result = await this.logService.searchLogs(userId, query);
    return {
      success: true,
      data: result,
    };
  }

  @Get('type/:type')
  async findByType(@Param('type') type: string, @Request() req) {
    const userId = req.user.id;
    const result = await this.logService.findByType(userId, type);
    return {
      success: true,
      data: result,
    };
  }

  @Get('tags')
  async findByTags(@Request() req, @Query('tags') tags: string) {
    if (!tags) {
      return {
        success: false,
        message: '标签参数不能为空',
        data: [],
      };
    }

    const tagArray = tags.split(',').map(tag => tag.trim());
    const userId = req.user.id;
    const result = await this.logService.findByTags(userId, tagArray);
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    const result = await this.logService.findOne(id, userId);
    return {
      success: true,
      data: result,
    };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateLogEntryDto: UpdateLogEntryDto, @Request() req) {
    const userId = req.user.id;
    const result = await this.logService.update(id, updateLogEntryDto, userId);
    return {
      success: true,
      message: '日志条目更新成功',
      data: result,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    await this.logService.remove(id, userId);
    return {
      success: true,
      message: '日志条目删除成功',
    };
  }

  @Post('analyze')
  async analyzeLog(@Body() analyzeLogDto: AnalyzeLogDto, @Request() req) {
    const result = await this.logService.analyzeLogContent(analyzeLogDto.content);
    return {
      success: true,
      message: '日志分析完成',
      data: result,
    };
  }

  @Post('smart-log')
  async createSmartLog(@Body() smartLogDto: SmartLogDto, @Request() req) {
    const userId = req.user.id;
    const result = await this.logService.createSmartLog(smartLogDto, userId);
    return {
      success: true,
      message: '智能日志创建成功',
      data: result,
    };
  }

  @Get('types')
  async getLogTypes(@Request() req) {
    const userId = req.user.id;
    const result = await this.logService.getLogTypes(userId);
    return {
      success: true,
      data: result,
    };
  }
}