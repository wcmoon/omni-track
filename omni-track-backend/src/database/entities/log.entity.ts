import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('logs')
@Index(['userId', 'createdAt'])
@Index(['type'])
export class Log {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  type?: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'json', nullable: true })
  metadata?: any;

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[];

  @Column({ type: 'varchar', length: 50, nullable: true })
  mood?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  energy?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  location?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  weather?: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid', nullable: true })
  projectId?: string;

  @Column({ type: 'uuid', nullable: true })
  relatedTaskId?: string;

  @Column({ type: 'boolean', default: false })
  aiEnhanced!: boolean;

  @Column({ type: 'json', nullable: true })
  aiSuggestions?: any[];

  @Column({ type: 'varchar', length: 50, nullable: true })
  sentiment?: string;

  @Column({ type: 'simple-array', nullable: true })
  categories?: string[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}