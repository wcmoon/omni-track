import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { LogService } from './log.service';
import { CreateLogEntryDto, UpdateLogEntryDto } from './dto/log.dto';

@Controller('logs')
@UseGuards(JwtAuthGuard)
export class LogController {
  constructor(private readonly logService: LogService) {}

  @Post()
  async create(@Body() createLogEntryDto: CreateLogEntryDto, @Request() req) {
    const result = await this.logService.create(createLogEntryDto, req.user.id);
    return {
      success: true,
      message: '日志条目创建成功',
      data: result,
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

    const result = await this.logService.findAll(req.user.id, options);
    return {
      success: true,
      data: result,
    };
  }

  @Get('statistics')
  async getStatistics(@Request() req) {
    const result = await this.logService.getLogStatistics(req.user.id);
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

    const result = await this.logService.searchLogs(req.user.id, query);
    return {
      success: true,
      data: result,
    };
  }

  @Get('type/:type')
  async findByType(@Param('type') type: string, @Request() req) {
    const result = await this.logService.findByType(req.user.id, type);
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
    const result = await this.logService.findByTags(req.user.id, tagArray);
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const result = await this.logService.findOne(id, req.user.id);
    return {
      success: true,
      data: result,
    };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateLogEntryDto: UpdateLogEntryDto, @Request() req) {
    const result = await this.logService.update(id, updateLogEntryDto, req.user.id);
    return {
      success: true,
      message: '日志条目更新成功',
      data: result,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    await this.logService.remove(id, req.user.id);
    return {
      success: true,
      message: '日志条目删除成功',
    };
  }
}