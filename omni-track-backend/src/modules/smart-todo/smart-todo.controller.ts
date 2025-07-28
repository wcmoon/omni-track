import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { SmartTodoService } from './smart-todo.service';
import { AnalyzeTaskDto, BreakdownTaskDto } from './dto/smart-todo.dto';

@Controller('smart-todo')
@UseGuards(JwtAuthGuard)
export class SmartTodoController {
  constructor(private readonly smartTodoService: SmartTodoService) {}

  @Post('analyze')
  async analyzeTask(@Body() analyzeTaskDto: AnalyzeTaskDto, @Request() req) {
    const dueDate = analyzeTaskDto.dueDate ? new Date(analyzeTaskDto.dueDate) : undefined;
    const result = await this.smartTodoService.analyzeTask(
      analyzeTaskDto.title,
      analyzeTaskDto.description,
      dueDate,
      req.user.id
    );
    
    return {
      success: true,
      message: '任务分析完成',
      data: result,
    };
  }

  @Post('breakdown')
  async breakdownTask(@Body() breakdownTaskDto: BreakdownTaskDto) {
    const result = await this.smartTodoService.breakdownTask(
      breakdownTaskDto.title,
      breakdownTaskDto.description
    );
    
    return {
      success: true,
      message: '任务分解完成',
      data: result,
    };
  }

  @Get('reminders')
  async getSmartReminders(@Request() req) {
    const result = await this.smartTodoService.getSmartReminders(req.user.id);
    
    return {
      success: true,
      message: '智能提醒获取成功',
      data: result,
    };
  }

  @Get('workflow-suggestions')
  async getWorkflowSuggestions(@Request() req) {
    const result = await this.smartTodoService.suggestWorkflow(req.user.id);
    
    return {
      success: true,
      message: '工作流程建议获取成功',
      data: result,
    };
  }

  @Get('dashboard')
  async getSmartDashboard(@Request() req) {
    const userId = req.user.id;
    const [reminders, workflow] = await Promise.all([
      this.smartTodoService.getSmartReminders(userId),
      this.smartTodoService.suggestWorkflow(userId),
    ]);

    return {
      success: true,
      message: '智能仪表盘数据获取成功',
      data: {
        reminders: reminders.slice(0, 3), // 最重要的3个提醒
        recommendedTasks: workflow.recommendedTasks.slice(0, 3), // 推荐的3个任务
        workflowTips: workflow.workflowTips.slice(0, 2), // 2个工作流程建议
        summary: {
          totalReminders: reminders.length,
          urgentReminders: reminders.filter(r => r.priority === 'high').length,
          recommendedTasksCount: workflow.recommendedTasks.length,
        },
      },
    };
  }
}