import { IsString, IsOptional, IsBoolean, MinLength, MaxLength } from 'class-validator';

export class CreateProjectDto {
  @IsString({ message: '项目名称不能为空' })
  @MinLength(1, { message: '项目名称至少需要1个字符' })
  @MaxLength(100, { message: '项目名称不能超过100个字符' })
  name: string;

  @IsOptional()
  @IsString({ message: '项目描述必须是字符串' })
  @MaxLength(500, { message: '项目描述不能超过500个字符' })
  description?: string;

  @IsOptional()
  @IsString({ message: '颜色必须是字符串' })
  color?: string;

  @IsOptional()
  @IsString({ message: '图标必须是字符串' })
  icon?: string;
}

export class UpdateProjectDto {
  @IsOptional()
  @IsString({ message: '项目名称必须是字符串' })
  @MinLength(1, { message: '项目名称至少需要1个字符' })
  @MaxLength(100, { message: '项目名称不能超过100个字符' })
  name?: string;

  @IsOptional()
  @IsString({ message: '项目描述必须是字符串' })
  @MaxLength(500, { message: '项目描述不能超过500个字符' })
  description?: string;

  @IsOptional()
  @IsString({ message: '颜色必须是字符串' })
  color?: string;

  @IsOptional()
  @IsString({ message: '图标必须是字符串' })
  icon?: string;

  @IsOptional()
  @IsBoolean({ message: '归档状态必须是布尔值' })
  isArchived?: boolean;
}

export class ProjectResponseDto {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  userId: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}