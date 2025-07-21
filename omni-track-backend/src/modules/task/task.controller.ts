import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TaskService } from './task.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { SmartCreateTaskDto, BatchCreateTaskDto, AnalyzeTaskDto } from './dto/smart-task.dto';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  async create(@Body() createTaskDto: CreateTaskDto, @Request() req) {
    const userId = req.user?.id || '1751615073420';
    const result = await this.taskService.create(createTaskDto, userId);
    return {
      success: true,
      message: '任务创建成功',
      data: result,
    };
  }

  @Get()
  async findAll(@Request() req, @Query('projectId') projectId?: string) {
    const userId = req.user?.id || '1751615073420';
    const result = await this.taskService.findAll(userId, projectId);
    return {
      success: true,
      data: result,
    };
  }

  @Get('statistics')
  async getStatistics(@Request() req) {
    const userId = req.user?.id || '1751615073420';
    const result = await this.taskService.getTaskStatistics(userId);
    return {
      success: true,
      data: result,
    };
  }

  @Get('status/:status')
  async findByStatus(@Param('status') status: 'pending' | 'in_progress' | 'completed' | 'cancelled', @Request() req) {
    const userId = req.user?.id || '1751615073420';
    const result = await this.taskService.findByStatus(userId, status);
    return {
      success: true,
      data: result,
    };
  }

  @Get('priority/:priority')
  async findByPriority(@Param('priority') priority: 'low' | 'medium' | 'high', @Request() req) {
    const userId = req.user?.id || '1751615073420';
    const result = await this.taskService.findByPriority(userId, priority);
    return {
      success: true,
      data: result,
    };
  }

  @Get('overdue')
  async findOverdueTasks(@Request() req) {
    const userId = req.user?.id || '1751615073420';
    const result = await this.taskService.findOverdueTasks(userId);
    return {
      success: true,
      data: result,
    };
  }

  @Patch(':id/complete')
  async completeTask(@Param('id') id: string, @Request() req) {
    const userId = req.user?.id || '1751615073420';
    const result = await this.taskService.update(id, { status: 'completed' }, userId);
    return {
      success: true,
      message: '任务已完成',
      data: result,
    };
  }

  @Get(':id/subtasks')
  async findSubTasks(@Param('id') id: string, @Request() req) {
    const userId = req.user?.id || '1751615073420';
    const result = await this.taskService.findSubTasks(id, userId);
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const userId = req.user?.id || '1751615073420';
    const result = await this.taskService.findOne(id, userId);
    return {
      success: true,
      data: result,
    };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto, @Request() req) {
    const userId = req.user?.id || '1751615073420';
    const result = await this.taskService.update(id, updateTaskDto, userId);
    return {
      success: true,
      message: '任务更新成功',
      data: result,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const userId = req.user?.id || '1751615073420';
    await this.taskService.remove(id, userId);
    return {
      success: true,
      message: '任务删除成功',
    };
  }

  @Post('smart-create')
  async smartCreate(@Body() smartCreateTaskDto: SmartCreateTaskDto, @Request() req) {
    const userId = req.user?.id || '1751615073420';
    const result = await this.taskService.smartCreate(smartCreateTaskDto, userId);
    return {
      success: true,
      message: '智能任务创建成功',
      data: result,
    };
  }

  @Post('batch-create')
  async batchCreate(@Body() batchCreateTaskDto: BatchCreateTaskDto, @Request() req) {
    const userId = req.user?.id || '1751615073420';
    const result = await this.taskService.batchCreate(batchCreateTaskDto, userId);
    return {
      success: true,
      message: `批量创建 ${result.created.length} 个任务成功`,
      data: result,
    };
  }

  @Post(':id/auto-breakdown')
  async autoBreakdown(@Param('id') id: string, @Request() req) {
    const userId = req.user?.id || '1751615073420';
    const result = await this.taskService.autoBreakdownTask(id, userId);
    return {
      success: true,
      message: '任务自动分解完成',
      data: result,
    };
  }

  @Post('analyze')
  async analyzeTask(@Body() analyzeTaskDto: AnalyzeTaskDto, @Request() req) {
    const userId = req.user?.id || '1751615073420'; // Test user ID
    const result = await this.taskService.analyzeTask(analyzeTaskDto.description, userId);
    return {
      success: true,
      message: '任务分析完成',
      data: result,
    };
  }

  @Get('projects/summary')
  async getProjectsSummary(@Request() req) {
    const userId = req.user?.id || '1751615073420'; // Test user ID
    const result = await this.taskService.getProjectsSummary(userId);
    return {
      success: true,
      data: result,
    };
  }
}