import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TaskService } from './task.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  async create(@Body() createTaskDto: CreateTaskDto, @Request() req) {
    const result = await this.taskService.create(createTaskDto, req.user.id);
    return {
      success: true,
      message: '任务创建成功',
      data: result,
    };
  }

  @Get()
  async findAll(@Request() req, @Query('projectId') projectId?: string) {
    const result = await this.taskService.findAll(req.user.id, projectId);
    return {
      success: true,
      data: result,
    };
  }

  @Get('statistics')
  async getStatistics(@Request() req) {
    const result = await this.taskService.getTaskStatistics(req.user.id);
    return {
      success: true,
      data: result,
    };
  }

  @Get('status/:status')
  async findByStatus(@Param('status') status: 'pending' | 'in_progress' | 'completed' | 'cancelled', @Request() req) {
    const result = await this.taskService.findByStatus(req.user.id, status);
    return {
      success: true,
      data: result,
    };
  }

  @Get('priority/:priority')
  async findByPriority(@Param('priority') priority: 'low' | 'medium' | 'high', @Request() req) {
    const result = await this.taskService.findByPriority(req.user.id, priority);
    return {
      success: true,
      data: result,
    };
  }

  @Get('overdue')
  async findOverdueTasks(@Request() req) {
    const result = await this.taskService.findOverdueTasks(req.user.id);
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const result = await this.taskService.findOne(id, req.user.id);
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id/subtasks')
  async findSubTasks(@Param('id') id: string, @Request() req) {
    const result = await this.taskService.findSubTasks(id, req.user.id);
    return {
      success: true,
      data: result,
    };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto, @Request() req) {
    const result = await this.taskService.update(id, updateTaskDto, req.user.id);
    return {
      success: true,
      message: '任务更新成功',
      data: result,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    await this.taskService.remove(id, req.user.id);
    return {
      success: true,
      message: '任务删除成功',
    };
  }
}