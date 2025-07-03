import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Project } from '../../database/entities/project.entity';
import { CreateProjectDto, UpdateProjectDto, ProjectResponseDto } from './dto/project.dto';

@Injectable()
export class ProjectService {
  private projects: Project[] = []; // 临时存储，后续会替换为数据库

  async create(createProjectDto: CreateProjectDto, userId: string): Promise<ProjectResponseDto> {
    const project: Project = {
      id: Date.now().toString(),
      name: createProjectDto.name,
      description: createProjectDto.description,
      color: createProjectDto.color || '#3b82f6',
      icon: createProjectDto.icon || 'folder',
      userId,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.projects.push(project);
    return this.toResponseDto(project);
  }

  async findAll(userId: string): Promise<ProjectResponseDto[]> {
    const userProjects = this.projects.filter(p => p.userId === userId && !p.isArchived);
    return userProjects.map(p => this.toResponseDto(p));
  }

  async findOne(id: string, userId: string): Promise<ProjectResponseDto> {
    const project = this.projects.find(p => p.id === id && p.userId === userId);
    if (!project) {
      throw new NotFoundException('项目不存在');
    }
    return this.toResponseDto(project);
  }

  async update(id: string, updateProjectDto: UpdateProjectDto, userId: string): Promise<ProjectResponseDto> {
    const projectIndex = this.projects.findIndex(p => p.id === id);
    if (projectIndex === -1) {
      throw new NotFoundException('项目不存在');
    }

    const project = this.projects[projectIndex];
    if (project.userId !== userId) {
      throw new ForbiddenException('无权限修改此项目');
    }

    // 更新项目
    this.projects[projectIndex] = {
      ...project,
      ...updateProjectDto,
      updatedAt: new Date(),
    };

    return this.toResponseDto(this.projects[projectIndex]);
  }

  async remove(id: string, userId: string): Promise<void> {
    const projectIndex = this.projects.findIndex(p => p.id === id);
    if (projectIndex === -1) {
      throw new NotFoundException('项目不存在');
    }

    const project = this.projects[projectIndex];
    if (project.userId !== userId) {
      throw new ForbiddenException('无权限删除此项目');
    }

    // 软删除：标记为已归档
    this.projects[projectIndex] = {
      ...project,
      isArchived: true,
      updatedAt: new Date(),
    };
  }

  async archive(id: string, userId: string): Promise<ProjectResponseDto> {
    return this.update(id, { isArchived: true }, userId);
  }

  async unarchive(id: string, userId: string): Promise<ProjectResponseDto> {
    return this.update(id, { isArchived: false }, userId);
  }

  async getArchivedProjects(userId: string): Promise<ProjectResponseDto[]> {
    const archivedProjects = this.projects.filter(p => p.userId === userId && p.isArchived);
    return archivedProjects.map(p => this.toResponseDto(p));
  }

  private toResponseDto(project: Project): ProjectResponseDto {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      color: project.color,
      icon: project.icon,
      userId: project.userId,
      isArchived: project.isArchived,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }
}