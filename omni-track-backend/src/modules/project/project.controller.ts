import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ProjectService } from './project.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  async create(@Body() createProjectDto: CreateProjectDto, @Request() req) {
    const result = await this.projectService.create(createProjectDto, req.user.id);
    return {
      success: true,
      message: '项目创建成功',
      data: result,
    };
  }

  @Get()
  async findAll(@Request() req) {
    const result = await this.projectService.findAll(req.user.id);
    return {
      success: true,
      data: result,
    };
  }

  @Get('archived')
  async getArchivedProjects(@Request() req) {
    const result = await this.projectService.getArchivedProjects(req.user.id);
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const result = await this.projectService.findOne(id, req.user.id);
    return {
      success: true,
      data: result,
    };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto, @Request() req) {
    const result = await this.projectService.update(id, updateProjectDto, req.user.id);
    return {
      success: true,
      message: '项目更新成功',
      data: result,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    await this.projectService.remove(id, req.user.id);
    return {
      success: true,
      message: '项目删除成功',
    };
  }

  @Post(':id/archive')
  async archive(@Param('id') id: string, @Request() req) {
    const result = await this.projectService.archive(id, req.user.id);
    return {
      success: true,
      message: '项目已归档',
      data: result,
    };
  }

  @Post(':id/unarchive')
  async unarchive(@Param('id') id: string, @Request() req) {
    const result = await this.projectService.unarchive(id, req.user.id);
    return {
      success: true,
      message: '项目已取消归档',
      data: result,
    };
  }
}