import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('text')
  description!: string; // 任务描述(必填)

  @Column({ nullable: true })
  title?: string; // 任务标题(可选)

  @Column({
    type: 'enum',
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  })
  status!: 'pending' | 'in_progress' | 'completed' | 'cancelled';

  @Column({
    type: 'enum',
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  })
  priority!: 'low' | 'medium' | 'high';

  @Column({ nullable: true })
  completionTime?: Date; // 任务需要完成的时间(可选)

  @Column({ nullable: true })
  dueDate?: Date; // 截止日期(可选)

  @Column({ nullable: true })
  endTime?: string; // 具体时间(HH:mm格式)(可选)

  @Column({ nullable: true })
  estimatedDuration?: number; // AI分析预估的花费时间(分钟)(可选)

  @Column({ nullable: true })
  actualDuration?: number; // 实际花费时间(分钟)(可选)

  @Column('simple-array', { nullable: true })
  tags?: string[]; // 任务标签(可选)

  @Column()
  userId!: string;

  @Column({ nullable: true })
  projectId?: string; // 项目ID(可选)

  @Column({ nullable: true })
  parentTaskId?: string; // 父任务ID(可选)

  // 重复相关字段
  @Column({ default: false })
  isRecurring?: boolean; // 是否周期循环任务(可选)

  @Column('json', { nullable: true })
  recurrencePattern?: {
    type: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    daysOfWeek?: number[];
    dayOfMonth?: number;
    endDate?: Date;
    occurrences?: number;
  }; // 循环周期(可选)

  // AI分析相关字段
  @Column({ default: false })
  aiGenerated!: boolean;

  @Column('text', { nullable: true })
  aiContext?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ nullable: true })
  completedAt?: Date;

  // 关联用户
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user?: User;
}