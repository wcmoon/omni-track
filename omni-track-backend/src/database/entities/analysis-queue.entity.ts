import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum AnalysisType {
  TASK_ANALYSIS = 'task_analysis',
  LOG_ANALYSIS = 'log_analysis',
  PATTERN_ANALYSIS = 'pattern_analysis',
  WEEKLY_REPORT = 'weekly_report',
  MONTHLY_REPORT = 'monthly_report',
}

export enum AnalysisStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  RETRY = 'retry',
}

export enum AnalysisPriority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  URGENT = 4,
}

@Entity('analysis_queue')
@Index(['status', 'priority', 'createdAt'])
@Index(['entityType', 'entityId'])
export class AnalysisQueue {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: AnalysisType,
  })
  type!: AnalysisType;

  @Column({
    type: 'enum',
    enum: AnalysisStatus,
    default: AnalysisStatus.PENDING,
  })
  status!: AnalysisStatus;

  @Column({
    type: 'enum',
    enum: AnalysisPriority,
    default: AnalysisPriority.NORMAL,
  })
  priority!: AnalysisPriority;

  @Column({ type: 'varchar', length: 50 })
  entityType!: string; // 'task', 'log', 'user'

  @Column({ type: 'uuid' })
  entityId!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'json', nullable: true })
  inputData?: any; // 分析所需的输入数据

  @Column({ type: 'json', nullable: true })
  result?: any; // 分析结果

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ type: 'int', default: 0 })
  retryCount!: number;

  @Column({ type: 'timestamp', nullable: true })
  startedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt?: Date; // 计划执行时间

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}